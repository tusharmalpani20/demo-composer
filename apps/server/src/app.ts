import cookie from '@fastify/cookie';
import fastifyCors from "@fastify/cors";
import fastifyMultipart from "@fastify/multipart";
import fastifySwagger from '@fastify/swagger';
import fastifyApiReference from "@scalar/fastify-api-reference";
import fastify, { type FastifyError, type FastifyServerOptions } from "fastify";
import { jsonSchemaTransform, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { error_handler } from './common/helper_function/error_handler.helper.js';
import { get_cookie_config } from "./config/cookie.config.js";
import { get_cors_config } from "./config/cors.config.js";
import { initialize_event_emitter } from './config/event.config.js';
import requestDec from './config/fastify_decoder.config.js';
import { pool } from './config/database.config.js';
import {
  build_public_instance_routes,
  type PublicInstanceRouteService,
} from './modules/public-instance/public-instance.routes.js';
import { build_public_instance_repository } from './modules/public-instance/public-instance.repository.js';
import { build_public_instance_service } from './modules/public-instance/public-instance.service.js';
import {
  build_first_run_setup_routes,
  type FirstRunSetupRouteService,
} from './modules/setup/first-run-setup.routes.js';
import { build_first_run_setup_repository } from './modules/setup/first-run-setup.repository.js';
import { build_first_run_setup_service } from './modules/setup/first-run-setup.service.js';
import {
  build_authentication_session_routes,
  type AuthenticationSessionRouteService,
} from './modules/authentication/session.routes.js';
import { build_authentication_session_repository } from './modules/authentication/session.repository.js';
import { build_authentication_session_service } from './modules/authentication/session.service.js';
import {
  build_project_routes,
  type ProjectRouteDependencies,
} from './modules/project/project.routes.js';
import { build_project_repository } from './modules/project/project.repository.js';
import { build_project_service } from './modules/project/project.service.js';
import {
  build_capture_session_routes,
  type CaptureSessionRouteDependencies,
} from './modules/capture-session/capture-session.routes.js';
import { build_capture_session_repository } from './modules/capture-session/capture-session.repository.js';
import { build_capture_session_service } from './modules/capture-session/capture-session.service.js';
import {
  build_capture_asset_routes,
  type CaptureAssetRouteDependencies,
} from './modules/capture-asset/capture-asset.routes.js';
import { build_capture_asset_repository } from './modules/capture-asset/capture-asset.repository.js';
import { build_capture_asset_service } from './modules/capture-asset/capture-asset.service.js';
import { build_local_file_storage_provider } from "./modules/file-storage/local-file-storage.provider.js";
import {
  build_capture_event_routes,
  type CaptureEventRouteDependencies,
} from './modules/capture-event/capture-event.routes.js';
import { build_capture_event_repository } from './modules/capture-event/capture-event.repository.js';
import { build_capture_event_service } from './modules/capture-event/capture-event.service.js';
import {
  build_guide_routes,
  type GuideRouteDependencies,
} from './modules/guide/guide.routes.js';
import { build_guide_repository } from './modules/guide/guide.repository.js';
import { build_guide_service } from './modules/guide/guide.service.js';
import {
  build_publish_routes,
  type PublishRouteDependencies,
} from './modules/publish/publish.routes.js';
import { build_publish_repository } from './modules/publish/publish.repository.js';
import { build_publish_service } from './modules/publish/publish.service.js';

type BuildOptions = FastifyServerOptions & {
  public_instance_service?: PublicInstanceRouteService;
  first_run_setup_service?: FirstRunSetupRouteService;
  authentication_session_service?: AuthenticationSessionRouteService;
  project_service?: ProjectRouteDependencies["project_service"];
  capture_session_service?: CaptureSessionRouteDependencies["capture_session_service"];
  capture_asset_service?: CaptureAssetRouteDependencies["capture_asset_service"];
  capture_event_service?: CaptureEventRouteDependencies["capture_event_service"];
  guide_service?: GuideRouteDependencies["guide_service"];
  publish_service?: PublishRouteDependencies["publish_service"];
};

const default_local_storage_root = () => (
    process.env.DEMO_COMPOSER_LOCAL_STORAGE_ROOT || "./storage"
);

const default_max_screenshot_upload_bytes = () => {
    const configured = Number(process.env.DEMO_COMPOSER_MAX_SCREENSHOT_UPLOAD_BYTES);

    return Number.isFinite(configured) && configured > 0
        ? configured
        : 10 * 1024 * 1024;
};

export const build = (opts: BuildOptions = {}) => {
  const {
      public_instance_service,
      first_run_setup_service,
      authentication_session_service,
      project_service,
      capture_session_service,
      capture_asset_service,
      capture_event_service,
      guide_service,
      publish_service,
      ...fastify_options
  } = opts;
  const app = fastify(fastify_options);
  const max_screenshot_upload_bytes = default_max_screenshot_upload_bytes();

  // Register request decorators first
  app.register(requestDec);

  // Register CORS
  app.register(fastifyCors, get_cors_config().fastify_options);

  // Register cookie plugin here, after CORS but before other plugins
  app.register(cookie, get_cookie_config());

  // Register Multipart right after CORS
  app.register(fastifyMultipart, {
      limits: {
          fileSize: max_screenshot_upload_bytes,
          files: 10
      },
  });

  app.setErrorHandler(async (error, request, response) => {
      error_handler(error as FastifyError, request, response)
  });

  // Set up Zod as the validator and serializer
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Register Swagger
  app.register(fastifySwagger, {
      openapi: {
          info: {
              title: 'ORCA',
              description: 'ORCA',
              version: '1.0.0'
          },
          // Add security schemes definition
          components: {
              securitySchemes: {
                  bearerAuth: {
                      type: 'http',
                      scheme: 'bearer',
                      bearerFormat: 'JWT',
                      description: 'Enter your JWT token'
                  }
              },
          },

          tags: [
              { name: 'authentication', description: 'Authentication related end-points' }
          ],
          servers: [
              {
                  url: 'http://localhost:4000/api/v1',
                  description: 'Development server'
              }
          ],
      },
      transform: jsonSchemaTransform,
  });


  // Register Scalar API Reference
  if (process.env.DEV_TYPE === "development") {
      app.register(fastifyApiReference, {
          routePrefix: '/documentation',
          configuration: {
              //title: 'ORCA API Documentation',
              theme: 'bluePlanet', //'alternate' | 'default' | 'moon' | 'purple' | 'solarized' | 'bluePlanet' | 'deepSpace' | 'saturn' | 'kepler' | 'mars' | 'none';
              spec: {
                  content: () => app.swagger(),
              },
              metaData: {
                  title: 'DEMO COMPOSER API Documentation',
                  description: 'DEMO COMPOSER API Documentation',
                  ogDescription: 'DEMO COMPOSER API Documentation',
                  ogTitle: 'DEMO COMPOSER API Documentation',
                  // ogImage: 'https://example.com/image.png',
                  // twitterCard: 'summary_large_image',
                  // // Add more...
              },

          },
      });


      // app.register(fastifySwaggerUi, {
      //     routePrefix: '/documentation',
      //     uiConfig: {
      //         docExpansion: 'full',
      //         deepLinking: false
      //     },
      //     uiHooks: {
      //         onRequest: function (request, reply, next) { next() },
      //         preHandler: function (request, reply, next) { next() }
      //     },
      //     staticCSP: true,
      //     transformStaticCSP: (header) => header,
      //     transformSpecification: (swaggerObject, request, reply) => { return swaggerObject },
      //     transformSpecificationClone: true
      // })
  }

  initialize_event_emitter();

  app.register(build_public_instance_routes(
      public_instance_service ?? build_public_instance_service(
          build_public_instance_repository(pool)
      )
  ), {
      prefix: "/api/v1/public",
  });

  app.register(build_first_run_setup_routes(
      first_run_setup_service ?? build_first_run_setup_service(
          build_first_run_setup_repository(pool)
      )
  ), {
      prefix: "/api/v1/setup",
  });

  app.register(build_authentication_session_routes(
      authentication_session_service ?? build_authentication_session_service(
          build_authentication_session_repository(pool)
      )
  ), {
      prefix: "/api/v1/authentication",
  });

  const default_authentication_session_service = authentication_session_service ?? build_authentication_session_service(
      build_authentication_session_repository(pool)
  );
  const default_capture_file_storage = build_local_file_storage_provider({
      root: default_local_storage_root(),
  });
  const default_capture_asset_service = capture_asset_service ?? build_capture_asset_service(
      build_capture_asset_repository(pool),
      {
          file_storage: default_capture_file_storage,
          max_upload_bytes: max_screenshot_upload_bytes,
      }
  );

  app.register(build_project_routes({
      auth_service: {
          get_current_auth_context: default_authentication_session_service.get_current_auth_context,
      },
      project_service: project_service ?? build_project_service(
          build_project_repository(pool)
      ),
  }), {
      prefix: "/api/v1/projects",
  });

  app.register(build_capture_session_routes({
      auth_service: {
          get_current_auth_context: default_authentication_session_service.get_current_auth_context,
      },
      capture_session_service: capture_session_service ?? build_capture_session_service(
          build_capture_session_repository(pool)
      ),
  }), {
      prefix: "/api/v1/projects",
  });

  app.register(build_capture_asset_routes({
      auth_service: {
          get_current_auth_context: default_authentication_session_service.get_current_auth_context,
      },
      capture_asset_service: default_capture_asset_service,
  }), {
      prefix: "/api/v1/projects",
  });

  app.register(build_capture_event_routes({
      auth_service: {
          get_current_auth_context: default_authentication_session_service.get_current_auth_context,
      },
      capture_event_service: capture_event_service ?? build_capture_event_service(
          build_capture_event_repository(pool)
      ),
  }), {
      prefix: "/api/v1/projects",
  });

  app.register(build_guide_routes({
      auth_service: {
          get_current_auth_context: default_authentication_session_service.get_current_auth_context,
      },
      guide_service: guide_service ?? build_guide_service(
          build_guide_repository(pool),
          {
              public_base_url: process.env.API_URL,
              file_storage: default_capture_file_storage,
          }
      ),
      capture_asset_service: default_capture_asset_service,
  }), {
      prefix: "/api/v1/projects",
  });

  app.register(build_publish_routes({
      auth_service: {
          get_current_auth_context: default_authentication_session_service.get_current_auth_context,
      },
      publish_service: publish_service ?? build_publish_service(
          build_publish_repository(pool),
          {
              file_storage: default_capture_file_storage,
          }
      ),
  }), {
      prefix: "/api/v1",
  });

  return app;
};
