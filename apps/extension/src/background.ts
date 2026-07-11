import { createAutomaticCaptureController, type AutomaticCaptureResult } from "./lib/automatic-capture";
import type { PageClickCaptureMessage } from "./lib/content-click-capture";

type RuntimeMessage = PageClickCaptureMessage | {
  type: string;
};

type RuntimeApi = {
  runtime?: {
    onMessage?: {
      addListener?: (
        callback: (
          message: RuntimeMessage,
          sender: unknown,
          sendResponse: (response: AutomaticCaptureResult) => void
        ) => boolean | void
      ) => void;
    };
  };
};

const isPageClickCaptureMessage = (message: RuntimeMessage): message is PageClickCaptureMessage => (
  message.type === "ossie:page_click"
);

const runtime = (globalThis as { chrome?: RuntimeApi }).chrome?.runtime;
const handleAutomaticClick = createAutomaticCaptureController();

runtime?.onMessage?.addListener?.((message: RuntimeMessage, _sender, sendResponse) => {
  if (!isPageClickCaptureMessage(message)) {
    return false;
  }

  handleAutomaticClick(message)
    .then(sendResponse)
    .catch((error: unknown) => {
      sendResponse({
        ok: false,
        reason: "automatic_capture_failed",
        message: error instanceof Error ? error.message : "Automatic capture failed",
      });
    });

  return true;
});
