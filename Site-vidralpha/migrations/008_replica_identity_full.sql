-- Fix Realtime Payload for DELETE Operations
-- Setting REPLICA IDENTITY FULL ensures Postgres sends the entire row content for UPDATE/DELETE operations over logical replication, rather than just the primary key. This is required for our frontend components to correctly map delete payloads by their unique composite columns (such as line, category, measure).
ALTER TABLE item_costs REPLICA IDENTITY FULL;
ALTER TABLE glass_type_costs REPLICA IDENTITY FULL;
ALTER TABLE glass_color_costs REPLICA IDENTITY FULL;
ALTER TABLE glass_colors REPLICA IDENTITY FULL;
ALTER TABLE aluminum_colors REPLICA IDENTITY FULL;
ALTER TABLE aluminum_color_costs REPLICA IDENTITY FULL;
