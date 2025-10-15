import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, List, Code, TestTube } from "lucide-react";
import { mockTopics, mockSubTopics, mockProblems, mockTestCases } from "@/lib/mockData";

export default function Dashboard() {
  const stats = [
    {
      title: "Topics",
      value: mockTopics.length,
      icon: BookOpen,
      color: "text-blue-500",
    },
    {
      title: "Sub Topics",
      value: mockSubTopics.length,
      icon: List,
      color: "text-purple-500",
    },
    {
      title: "Problems",
      value: mockProblems.length,
      icon: Code,
      color: "text-green-500",
    },
    {
      title: "Test Cases",
      value: mockTestCases.length,
      icon: TestTube,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to Learning Content Management System</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">New problem added</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-accent" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Topic updated</p>
                  <p className="text-xs text-muted-foreground">5 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Public Problems</span>
                <span className="text-sm font-medium">{mockProblems.filter(p => p.is_public).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Active Problems</span>
                <span className="text-sm font-medium">{mockProblems.filter(p => p.is_active).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Avg Tests per Problem</span>
                <span className="text-sm font-medium">
                  {(mockTestCases.length / mockProblems.length).toFixed(1)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
