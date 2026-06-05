export const quote_database_identifier = (identifier: string) => `"${identifier.replaceAll('"', '""')}"`;
