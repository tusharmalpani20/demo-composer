import { createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { build } from "../../app";
import { pool } from "../../config/database.config";

const multipart_payload = (parts: Array<{
  name: string;
  value: string | Buffer;
  filename?: string;
  content_type?: string;
}>) => {
  const boundary = "----demo-composer-publish-test-boundary";
  const chunks: Buffer[] = [];

  for (const part of parts) {
    chunks.push(Buffer.from(`--${boundary}\r\n`));
    chunks.push(Buffer.from(
      `Content-Disposition: form-data; name="${part.name}"${
        part.filename ? `; filename="${part.filename}"` : ""
      }\r\n`
    ));
    if (part.content_type) {
      chunks.push(Buffer.from(`Content-Type: ${part.content_type}\r\n`));
    }
    chunks.push(Buffer.from("\r\n"));
    chunks.push(Buffer.isBuffer(part.value) ? part.value : Buffer.from(part.value));
    chunks.push(Buffer.from("\r\n"));
  }

  chunks.push(Buffer.from(`--${boundary}--\r\n`));

  return {
    headers: {
      "content-type": `multipart/form-data; boundary=${boundary}`,
    },
    payload: Buffer.concat(chunks),
  };
};

const reset_foundation_tables = async () => {
  await pool.query(`
    TRUNCATE TABLE
      auth_schema.auth_session,
      publish_schema.publish_link,
      publish_schema.published_artifact,
      guide_schema.guide_step,
      guide_schema.guide_block,
      guide_schema.guide,
      capture_schema.capture_event,
      capture_schema.capture_asset,
      file_schema.file,
      capture_schema.capture_session,
      project_schema.project,
      organization_schema.org_user,
      organization_schema.organization,
      user_schema.user
    RESTART IDENTITY CASCADE
  `);
};

const setup_owner = async () => {
  const app = build({ logger: false });
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/setup/first-run",
    payload: {
      owner: {
        email: "owner@example.com",
        password: "safe local password",
        first_name: "Owner",
        last_name: "User",
      },
      organization: {
        name: "Acme",
      },
    },
  });

  await app.close();
  expect(response.statusCode).toBe(201);
  return response.cookies.find((cookie) => cookie.name === "demo_composer_session")?.value ?? "";
};

const create_project = async (session_token: string) => {
  const app = build({ logger: false });
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/projects",
    cookies: { demo_composer_session: session_token },
    payload: { name: "Onboarding Demo" },
  });

  await app.close();
  expect(response.statusCode).toBe(201);
  return response.json().project.id as string;
};

const create_capture_session = async (session_token: string, project_id: string) => {
  const app = build({ logger: false });
  const response = await app.inject({
    method: "POST",
    url: `/api/v1/projects/${project_id}/capture-sessions`,
    cookies: { demo_composer_session: session_token },
    payload: {
      name: "Create department workflow",
      source_type: "extension",
    },
  });

  await app.close();
  expect(response.statusCode).toBe(201);
  return response.json().capture_session.id as string;
};

const upload_capture_asset = async (
  session_token: string,
  project_id: string,
  capture_session_id: string,
  bytes: Buffer
) => {
  const app = build({ logger: false });
  const response = await app.inject({
    method: "POST",
    url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/assets/upload`,
    cookies: { demo_composer_session: session_token },
    ...multipart_payload([
      {
        name: "file",
        filename: "department.png",
        content_type: "image/png",
        value: bytes,
      },
      { name: "width", value: "1440" },
      { name: "height", value: "900" },
      { name: "page_url", value: "https://example.test/departments" },
      { name: "page_title", value: "Department List" },
    ]),
  });

  await app.close();
  expect(response.statusCode).toBe(201);
  return response.json().capture_asset.id as string;
};

const create_capture_event = async (
  session_token: string,
  project_id: string,
  capture_session_id: string,
  capture_asset_id: string
) => {
  const app = build({ logger: false });
  const response = await app.inject({
    method: "POST",
    url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/events`,
    cookies: { demo_composer_session: session_token },
    payload: {
      event_type: "capture",
      event_index: 1,
      capture_asset_id,
      page_title: "Department List",
      page_url: "https://example.test/departments",
      metadata: {
        private_note: "do not publish",
      },
    },
  });

  await app.close();
  expect(response.statusCode).toBe(201);
  return response.json().capture_event.id as string;
};

describe("DB-backed guide publishing API", () => {
  let storage_root: string;
  let previous_storage_root: string | undefined;

  beforeEach(async () => {
    storage_root = await mkdtemp(path.join(tmpdir(), "demo-composer-publish-test-"));
    previous_storage_root = process.env.DEMO_COMPOSER_LOCAL_STORAGE_ROOT;
    process.env.DEMO_COMPOSER_LOCAL_STORAGE_ROOT = storage_root;
    await reset_foundation_tables();
  });

  afterEach(async () => {
    if (previous_storage_root === undefined) {
      delete process.env.DEMO_COMPOSER_LOCAL_STORAGE_ROOT;
    } else {
      process.env.DEMO_COMPOSER_LOCAL_STORAGE_ROOT = previous_storage_root;
    }
    await rm(storage_root, { recursive: true, force: true });
  });

  afterAll(async () => {
    await pool.end();
  });

  it("publishes republishes resolves streams and revokes a guide snapshot", async () => {
    const bytes = Buffer.from("fake png bytes");
    const session_token = await setup_owner();
    const project_id = await create_project(session_token);
    const capture_session_id = await create_capture_session(session_token, project_id);
    const capture_asset_id = await upload_capture_asset(session_token, project_id, capture_session_id, bytes);
    await create_capture_event(session_token, project_id, capture_session_id, capture_asset_id);

    const app = build({ logger: false });
    const create_guide_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/guides/from-capture-session/${capture_session_id}`,
      cookies: { demo_composer_session: session_token },
      payload: {
        title: "Department setup guide",
      },
    });
    expect(create_guide_response.statusCode).toBe(201);
    const guide_id = create_guide_response.json().guide.id as string;

    const publish_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}/publish`,
      cookies: { demo_composer_session: session_token },
    });
    expect(publish_response.statusCode).toBe(201);
    expect(publish_response.json().published_artifact.version_number).toBe(1);
    expect(publish_response.json().publish_link).toMatchObject({
      artifact_type: "guide",
      artifact_id: guide_id,
      visibility: "public",
      status: "active",
    });
    const slug = publish_response.json().publish_link.slug as string;

    const public_response = await app.inject({
      method: "GET",
      url: `/api/v1/public/publish-links/${slug}`,
    });
    expect(public_response.statusCode).toBe(200);
    expect(public_response.json().published_artifact.snapshot.blocks[0].source_asset).toMatchObject({
      id: capture_asset_id,
      file_url: `/api/v1/public/publish-links/${slug}/assets/${capture_asset_id}/file`,
      file: {
        original_name: "department.png",
        mime_type: "image/png",
        size_bytes: bytes.length,
      },
    });
    expect(JSON.stringify(public_response.json())).not.toContain("storage_key");
    expect(JSON.stringify(public_response.json())).not.toContain("private_note");
    expect(JSON.stringify(public_response.json())).not.toContain("organization_id");

    const public_asset_response = await app.inject({
      method: "GET",
      url: `/api/v1/public/publish-links/${slug}/assets/${capture_asset_id}/file`,
    });
    expect(public_asset_response.statusCode).toBe(200);
    expect(public_asset_response.headers["content-type"]).toBe("image/png");
    expect(public_asset_response.headers["content-length"]).toBe(String(bytes.length));
    expect(public_asset_response.body).toBe(bytes.toString());

    const update_response = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}`,
      cookies: { demo_composer_session: session_token },
      payload: {
        title: "Edited department setup guide",
      },
    });
    expect(update_response.statusCode).toBe(200);

    const republish_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}/publish`,
      cookies: { demo_composer_session: session_token },
    });
    expect(republish_response.statusCode).toBe(201);
    expect(republish_response.json().publish_link.slug).toBe(slug);
    expect(republish_response.json().published_artifact.version_number).toBe(2);

    const snapshot_rows = await pool.query<{
      title: string;
      version_number: number;
      snapshot_title: string;
    }>(`
      SELECT
        title,
        version_number,
        snapshot_json #>> '{guide,title}' AS snapshot_title
      FROM publish_schema.published_artifact
      WHERE artifact_id = $1
      ORDER BY version_number ASC
    `, [guide_id]);
    expect(snapshot_rows.rows).toEqual([
      {
        title: "Department setup guide",
        version_number: 1,
        snapshot_title: "Department setup guide",
      },
      {
        title: "Edited department setup guide",
        version_number: 2,
        snapshot_title: "Edited department setup guide",
      },
    ]);

    const revoke_response = await app.inject({
      method: "DELETE",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}/publish`,
      cookies: { demo_composer_session: session_token },
    });
    expect(revoke_response.statusCode).toBe(200);
    expect(revoke_response.json().publish_link.status).toBe("revoked");

    const revoked_public_response = await app.inject({
      method: "GET",
      url: `/api/v1/public/publish-links/${slug}`,
    });
    expect(revoked_public_response.statusCode).toBe(404);

    const after_revoke_publish_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}/publish`,
      cookies: { demo_composer_session: session_token },
    });
    expect(after_revoke_publish_response.statusCode).toBe(201);
    expect(after_revoke_publish_response.json().publish_link.slug).not.toBe(slug);
    expect(after_revoke_publish_response.json().published_artifact.version_number).toBe(3);

    const archive_response = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}`,
      cookies: { demo_composer_session: session_token },
      payload: {
        status: "archived",
      },
    });
    expect(archive_response.statusCode).toBe(200);
    const archived_publish_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}/publish`,
      cookies: { demo_composer_session: session_token },
    });
    expect(archived_publish_response.statusCode).toBe(409);
    expect(archived_publish_response.json().error.type).toBe("guide_not_publishable");

    const checksum = await pool.query<{ checksum_sha256: string }>(`
      SELECT checksum_sha256
      FROM file_schema.file
      WHERE id = (
        SELECT file_id
        FROM capture_schema.capture_asset
        WHERE id = $1
      )
    `, [capture_asset_id]);
    expect(checksum.rows[0]?.checksum_sha256).toBe(createHash("sha256").update(bytes).digest("hex"));

    await app.close();
  });
});
