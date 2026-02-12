import { Link } from "react-router-dom";
import { FolderKanban, MessageSquareText, Palette, ChevronRight } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

const settingsItems = [
  {
    title: "프로젝트 목록 보기",
    description: "프로젝트를 관리하고 삭제합니다.",
    to: "/settings/projects",
    icon: FolderKanban,
  },
  {
    title: "피드백 목록 보기",
    description: "Send Feedback로 저장된 내용을 확인합니다.",
    to: "/settings/feedback",
    icon: MessageSquareText,
  },
  {
    title: "색상 변경",
    description: "앱의 Primary 색상을 변경합니다.",
    to: "/settings/appearance",
    icon: Palette,
  },
] as const;

export default function Settings() {
  return (
    <MainLayout>
      <div className={cn("h-screen flex flex-col")}>
        <header className={cn("flex items-center justify-between px-6 py-4 border-b border-border bg-background")}>
          <div>
            <h1 className={cn("font-mono text-lg font-bold text-primary")}>Settings</h1>
            <p className={cn("text-sm text-muted-foreground")}>
              원하는 항목을 선택해서 상세 설정으로 이동하세요.
            </p>
          </div>
        </header>

        <div className={cn("flex-1 min-h-0 p-6")}>
          <div className={cn("max-w-2xl")}>
            <Card className={cn("overflow-hidden")}>
              <CardHeader className={cn("py-4")}>
                <CardTitle className={cn("font-mono text-lg font-bold text-primary")}>
                  Options
                </CardTitle>
              </CardHeader>
              <div className={cn("divide-y divide-border")}>
                {settingsItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "block px-4 py-3 transition-all duration-200",
                        "hover:bg-muted/40",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      )}
                    >
                      <div className={cn("flex items-center justify-between gap-4")}>
                        <div className={cn("flex items-center gap-3 min-w-0")}>
                          <span className={cn("w-8 h-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0")}>
                            <Icon className={cn("w-4 h-4 text-muted-foreground")} />
                          </span>
                          <div className={cn("min-w-0")}>
                            <div className={cn("text-sm font-medium text-foreground truncate")}>
                              {item.title}
                            </div>
                            <div className={cn("text-xs text-muted-foreground truncate")}>
                              {item.description}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className={cn("w-4 h-4 text-muted-foreground flex-shrink-0")} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
