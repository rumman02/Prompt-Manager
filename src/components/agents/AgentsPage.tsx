import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchBar } from "@/components/search-bar";
import { Icon } from "@/components/ui/icon";

export function AgentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const agentCount: number = 0;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        icon="agents"
        title="Agents"
        subtitle={`${agentCount} agent${agentCount !== 1 ? "s" : ""}${searchQuery ? ` matching "${searchQuery}"` : ""}`}
        actions={
          <div className="flex items-center gap-3">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search agents..."
            />
            <Button className="gap-2">
              <Icon name="add" size="sm" />
              Add Agent
            </Button>
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-6">
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
              <Icon name="agents" size="xl" className="text-primary" />
            </div>
            <h3 className="text-headline font-medium">No agents yet</h3>
            <p className="mt-1 max-w-sm text-caption text-muted-foreground">
              Agents let you bundle prompts, skills, and instructions into reusable assistants. Create your first agent to get started.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
