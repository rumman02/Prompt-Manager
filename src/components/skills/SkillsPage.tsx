import { useState } from "react";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchBar } from "@/components/search-bar";
import { Icon } from "@/components/ui/icon";

export function SkillsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const skillCount: number = 0;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        icon="skills"
        title="Skills"
        subtitle={`${skillCount} skill${skillCount !== 1 ? "s" : ""}${searchQuery ? ` matching "${searchQuery}"` : ""}`}
        actions={
          <div className="flex items-center gap-3">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search skills..."
            />
            <Button className="gap-2">
              <Icon name="add" size="sm" />
              Add Skill
            </Button>
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-6">
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
              <Icon name="skills" size="xl" className="text-primary" />
            </div>
            <CardTitle className="text-lg">No skills yet</CardTitle>
            <CardDescription className="mt-1 max-w-sm">
              Skills are reusable capabilities you can attach to agents. Create your first skill to get started.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
