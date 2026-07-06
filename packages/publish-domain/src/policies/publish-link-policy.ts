export const PUBLISH_SLUG_RETRY_LIMIT = 5;

export const publish_slug_for_link = (input: {
  existing_link: { slug: string } | null;
  generated_slug: string;
}) => input.existing_link?.slug ?? input.generated_slug;

export const should_retry_slug_conflict = (attempt: number) => (
  attempt < PUBLISH_SLUG_RETRY_LIMIT
);
