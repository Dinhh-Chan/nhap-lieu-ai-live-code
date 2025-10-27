import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Github, Eye, MessageSquare, Star, Code } from "lucide-react";
import type { User } from "@/types/user";
import type { UserStatistics } from "@/types/user-statistics";

interface ProfileSidebarProps {
  user?: User;
  statistics?: UserStatistics;
}

export const ProfileSidebar = ({ user, statistics }: ProfileSidebarProps) => {
  return (
    <div className="space-y-4">
      {/* Profile Card */}
      <Card className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
            {user ? user.fullname.split(' ').map(n => n[0]).join('').slice(0, 2) : 'DC'}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">{user?.fullname || 'Dinh Chan'}</h2>
            <p className="text-sm text-muted-foreground">@{user?.username || 'DinhH-Chan'}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {/* {statistics?.ranking > 0 ? `Rank ${statistics.ranking}` : 'Rank 1,318,457'} */}
            </p>
          </div>
        </div>
        <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          Edit Profile
        </Button>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{user?.dataPartitionCode || 'Vietnam'}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Github className="w-4 h-4" />
            <a href="#" className="hover:text-foreground transition-colors">{user?.username || 'Dinhh-Chan'}</a>
          </div>
        </div>
      </Card>

      {/* Community Stats */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 text-foreground">Community Stats</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-info" />
              <span className="text-sm text-foreground">Views</span>
            </div>
            <div className="text-right">
              <div className="font-semibold text-foreground">{statistics?.total_submissions || 0}</div>
              <div className="text-xs text-muted-foreground">Total submissions</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-accent" />
              <span className="text-sm text-foreground">Solution</span>
            </div>
            <div className="text-right">
              <div className="font-semibold text-foreground">{statistics?.accepted_submissions || 0}</div>
              <div className="text-xs text-muted-foreground">Accepted solutions</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-warning" />
              <span className="text-sm text-foreground">Discuss</span>
            </div>
            <div className="text-right">
              <div className="font-semibold text-foreground">{statistics?.accepted_submissions || 0}</div>
              <div className="text-xs text-muted-foreground">Accepted solutions</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-warning" />
              <span className="text-sm text-foreground">Reputation</span>
            </div>
            <div className="text-right">
              <div className="font-semibold text-foreground">{statistics?.accepted_submissions || 0}</div>
              <div className="text-xs text-muted-foreground">Accepted solutions</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Languages */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 text-foreground">Languages</h3>
        <div className="space-y-3">
          {statistics?.language_stats ? Object.entries(statistics.language_stats).map(([lang, count]) => (
            <div key={lang} className="flex items-center justify-between">
              <span className="text-sm text-foreground capitalize">{lang}</span>
              <span className="text-sm text-muted-foreground">{count} problems solved</span>
            </div>
          )) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Python3</span>
                <span className="text-sm text-muted-foreground">79 problems solved</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">MySQL</span>
                <span className="text-sm text-muted-foreground">11 problems solved</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Python</span>
                <span className="text-sm text-muted-foreground">9 problems solved</span>
              </div>
            </>
          )}
          <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Show more
          </button>
        </div>
      </Card>

      {/* Skills */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 text-foreground">Skills</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <span className="text-sm font-medium text-foreground">Advanced</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">Dynamic Programming ×3</Badge>
              <Badge variant="secondary" className="text-xs">Trie ×1</Badge>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-warning rounded-full"></div>
              <span className="text-sm font-medium text-foreground">Intermediate</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">Math ×17</Badge>
              <Badge variant="secondary" className="text-xs">Hash Table ×13</Badge>
              <Badge variant="secondary" className="text-xs">Database ×11</Badge>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
              <span className="text-sm font-medium text-foreground">Fundamental</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">Array ×56</Badge>
              <Badge variant="secondary" className="text-xs">String ×32</Badge>
              <Badge variant="secondary" className="text-xs">Sorting ×21</Badge>
            </div>
          </div>
          <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Show more
          </button>
        </div>
      </Card>
    </div>
  );
};
