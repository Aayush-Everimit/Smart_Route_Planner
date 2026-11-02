CREATE TABLE "edges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"graph_id" uuid NOT NULL,
	"source_node_id" uuid NOT NULL,
	"destination_node_id" uuid NOT NULL,
	"weight" double precision NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "graphs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"directed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"graph_id" uuid NOT NULL,
	"external_node_id" text NOT NULL,
	"name" text NOT NULL,
	"x_position" double precision DEFAULT 0 NOT NULL,
	"y_position" double precision DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "nodes_external_id_nonempty" CHECK (length("nodes"."external_node_id") > 0)
);
--> statement-breakpoint
ALTER TABLE "edges" ADD CONSTRAINT "edges_graph_id_graphs_id_fk" FOREIGN KEY ("graph_id") REFERENCES "public"."graphs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edges" ADD CONSTRAINT "edges_source_node_id_nodes_id_fk" FOREIGN KEY ("source_node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edges" ADD CONSTRAINT "edges_destination_node_id_nodes_id_fk" FOREIGN KEY ("destination_node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_graph_id_graphs_id_fk" FOREIGN KEY ("graph_id") REFERENCES "public"."graphs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "edges_graph_src_dst_uq" ON "edges" USING btree ("graph_id","source_node_id","destination_node_id");--> statement-breakpoint
CREATE INDEX "edges_graph_idx" ON "edges" USING btree ("graph_id");--> statement-breakpoint
CREATE UNIQUE INDEX "nodes_graph_external_uq" ON "nodes" USING btree ("graph_id","external_node_id");--> statement-breakpoint
CREATE INDEX "nodes_graph_idx" ON "nodes" USING btree ("graph_id");