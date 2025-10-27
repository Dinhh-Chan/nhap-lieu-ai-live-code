import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Code, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";

interface SubmissionListProps {
  submissions?: {
    problem_name: string;
    submitted_at: string;
    status: string;
    language: string;
  }[];
  recentAC?: {
    problem_name: string;
    submitted_at: string;
    status: string;
    language: string;
    code?: string;
    execution_time_ms?: number;
    memory_used_mb?: string;
  }[];
  onViewAllSubmissions?: () => void;
}

interface Submission {
  title: string;
  timeAgo: string;
}

const sampleSubmissions: Submission[] = [
  { title: "Two Sum", timeAgo: "2 days ago" },
  { title: "Coupon Code Validator", timeAgo: "4 months ago" },
  { title: "Maximum Depth of Binary Tree", timeAgo: "4 months ago" },
  { title: "Symmetric Tree", timeAgo: "4 months ago" },
  { title: "Same Tree", timeAgo: "4 months ago" },
  { title: "Binary Tree Inorder Traversal", timeAgo: "4 months ago" },
  { title: "Pascal's Triangle", timeAgo: "9 months ago" },
  { title: "Merge Sorted Array", timeAgo: "9 months ago" },
  { title: "Reverse Prefix of Word", timeAgo: "10 months ago" },
  { title: "Sum of Digits of String After Convert", timeAgo: "10 months ago" },
];

export const SubmissionList = ({ submissions, recentAC, onViewAllSubmissions }: SubmissionListProps) => {
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  };
  return (
    <Card className="p-6">
      <Tabs defaultValue="recent" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Recent AC
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="recent" className="space-y-0">
          <div className="flex justify-end mb-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onViewAllSubmissions}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View all submissions →
            </Button>
          </div>
          {(recentAC && recentAC.length > 0 ? recentAC.slice(0, 10).map((sub, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-3 border-b last:border-b-0 hover:bg-muted/30 transition-colors px-2 -mx-2 rounded"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                <span className="text-sm text-foreground hover:text-accent transition-colors cursor-pointer">
                  {sub.problem_name || "Unknown Problem"}
                </span>
                {sub.execution_time_ms && (
                  <span className="text-xs text-muted-foreground">
                    TLM: {sub.execution_time_ms}ms
                  </span>
                )}
                {sub.memory_used_mb && (
                  <span className="text-xs text-muted-foreground">
                    MLM: {sub.memory_used_mb}MB
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{formatTimeAgo(sub.submitted_at)}</span>
                {sub.code && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedSubmission(sub)}
                      >
                        <Code className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Code của bài: {sub.problem_name}</DialogTitle>
                      </DialogHeader>
                      <div className="mt-4">
                        <div className="bg-muted p-4 rounded-lg">
                          <pre className="text-sm overflow-x-auto">
                            <code>{selectedSubmission?.code || sub.code}</code>
                          </pre>
                        </div>
                        <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                          <span>Language: {sub.language}</span>
                          {sub.execution_time_ms && <span>Time: {sub.execution_time_ms}ms</span>}
                          {sub.memory_used_mb && <span>Memory: {sub.memory_used_mb}MB</span>}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          )) : sampleSubmissions.map((submission, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-3 border-b last:border-b-0 hover:bg-muted/30 transition-colors px-2 -mx-2 rounded"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                <span className="text-sm text-foreground hover:text-accent transition-colors cursor-pointer">
                  {submission.title}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">{submission.timeAgo}</span>
            </div>
          )))}
        </TabsContent>
      </Tabs>
    </Card>
  );
};
