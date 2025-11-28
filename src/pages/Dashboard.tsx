import { useState } from "react";
import { AlertCircle, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const SUPERSET_BASE_URL = "http://192.168.30.85:8088";
const DASHBOARD_ID = "12";
const NATIVE_FILTERS_KEY = "FJ6m45ke6zU";

const SUPERSET_DASHBOARD_URL = `${SUPERSET_BASE_URL}/superset/dashboard/${DASHBOARD_ID}/?native_filters_key=${NATIVE_FILTERS_KEY}&standalone=0`;

export default function Dashboard() {
  const [iframeError, setIframeError] = useState(false);

  const handleOpenInNewTab = () => {
    window.open(SUPERSET_DASHBOARD_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Bảng điều khiển
          </h1>
          <p className="text-muted-foreground">
            Chào mừng đến với Hệ thống quản lý nội dung học tập
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleOpenInNewTab}
          className="flex items-center gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          Mở trong tab mới
        </Button>
      </div>

      {/* Error Alert */}
      {iframeError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Không thể tải dashboard</AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              Không thể tải Superset dashboard. Vui lòng kiểm tra cấu hình Superset server.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInNewTab}
              className="mt-2"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Mở dashboard trong tab mới
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Superset Dashboard Iframe */}
      <div className="w-full h-[calc(100vh-200px)] border rounded-lg overflow-hidden bg-muted/50">
        <iframe
          src={SUPERSET_DASHBOARD_URL}
          className="w-full h-full border-0"
          title="Superset Dashboard"
          allowFullScreen
          onError={() => setIframeError(true)}
          onLoad={() => setIframeError(false)}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
        />
      </div>
    </div>
  );
}
