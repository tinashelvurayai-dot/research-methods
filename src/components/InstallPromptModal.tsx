import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Smartphone } from "lucide-react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const SEEN_KEY = "rm.installprompt.seen.v1";

export function InstallPromptModal() {
  const [open, setOpen] = useState(false);
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(display-mode: standalone)").matches) return;
    if (window.self !== window.top) return;
    if (localStorage.getItem(SEEN_KEY)) return;

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
      setOpen(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS doesn't fire beforeinstallprompt — show after short delay.
    const t = ios ? window.setTimeout(() => setOpen(true), 1500) : 0;

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      if (t) window.clearTimeout(t);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(SEEN_KEY, "1");
    setOpen(false);
  };

  const install = async () => {
    if (evt) {
      await evt.prompt();
      await evt.userChoice;
    }
    dismiss();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss(); }}>
      <DialogContent className="bg-popover max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-secondary" /> Install Research Methods
          </DialogTitle>
          <DialogDescription>
            Get the app on your phone for one-tap revision. No app store required.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          {isIOS ? (
            <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
              <li>Tap the <strong>Share</strong> button at the bottom of Safari.</li>
              <li>Choose <strong>Add to Home Screen</strong>.</li>
              <li>Tap <strong>Add</strong>. The app icon appears on your home screen.</li>
            </ol>
          ) : (
            <p className="text-muted-foreground">
              Tap <strong>Install App</strong> below. The app will appear on your home screen and open without a browser bar.
            </p>
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={dismiss}>Maybe later</Button>
          {!isIOS && (
            <Button onClick={install} className="bg-brand-gradient text-primary-foreground">
              <Download className="h-4 w-4 mr-1" /> Install App
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}