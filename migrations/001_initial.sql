PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS records (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  workspace TEXT NOT NULL DEFAULT 'demo',
  data TEXT NOT NULL CHECK(json_valid(data))
);
CREATE INDEX IF NOT EXISTS records_kind ON records(workspace,kind);
CREATE INDEX IF NOT EXISTS conversation_revisions ON records(workspace,json_extract(data,'$.leadId'),json_extract(data,'$.revision'));
CREATE INDEX IF NOT EXISTS job_status ON records(kind,json_extract(data,'$.status'));
CREATE TABLE IF NOT EXISTS requests(key TEXT PRIMARY KEY,result TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS record_links (
 source_id TEXT NOT NULL REFERENCES records(id),
 target_id TEXT NOT NULL REFERENCES records(id),
 relation TEXT NOT NULL,
 PRIMARY KEY(source_id,target_id,relation)
);
CREATE INDEX IF NOT EXISTS record_links_target ON record_links(target_id,relation);
CREATE TABLE IF NOT EXISTS migrations(version INTEGER PRIMARY KEY);
INSERT OR IGNORE INTO migrations VALUES(1);
