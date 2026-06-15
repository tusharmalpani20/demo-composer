export type PageClickCapturePayload = {
  page_url: string | null;
  page_title: string | null;
  target_text: string | null;
  target_role: string | null;
  target_test_id: string | null;
  target_selector: string | null;
  client_x: number;
  client_y: number;
  viewport_width: number | null;
  viewport_height: number | null;
  device_pixel_ratio: number | null;
  bounding_box: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
};

export type PageClickCaptureMessage = {
  type: "demo_composer:page_click";
  payload: PageClickCapturePayload;
};

const sensitive_field_selector = [
  "input",
  "textarea",
  "select",
  "[contenteditable]",
].join(",");

const cssEscape = (value: string) => (
  typeof CSS !== "undefined" && typeof CSS.escape === "function"
    ? CSS.escape(value)
    : value.replaceAll(/["\\]/g, "\\$&")
);

const numberOrNull = (value: number | undefined) => (
  typeof value === "number" && Number.isFinite(value) ? value : null
);

const findElement = (target: EventTarget | null) => (
  target instanceof Element ? target : null
);

const roleForElement = (element: Element) => {
  const explicitRole = element.getAttribute("role")?.trim();
  if (explicitRole) {
    return explicitRole;
  }

  const tagName = element.tagName.toLowerCase();
  if (tagName === "button") {
    return "button";
  }
  if (tagName === "a") {
    return "link";
  }

  return null;
};

export const truncateSafeText = (value: string | null | undefined) => {
  const trimmed = value?.replaceAll(/\s+/g, " ").trim() ?? "";
  return trimmed ? trimmed.slice(0, 120) : null;
};

const testIdForElement = (element: Element) => (
  element.getAttribute("data-testid")?.trim()
  || element.getAttribute("data-test-id")?.trim()
  || null
);

const selectorForElement = (element: Element) => {
  const testId = testIdForElement(element);
  const tagName = element.tagName.toLowerCase();

  if (testId) {
    return `${tagName}[data-testid="${cssEscape(testId)}"]`;
  }

  if (element.id) {
    return `${tagName}#${cssEscape(element.id)}`;
  }

  return tagName;
};

const boundingBoxForElement = (element: Element) => {
  const rect = element.getBoundingClientRect();
  if (
    !Number.isFinite(rect.x)
    || !Number.isFinite(rect.y)
    || !Number.isFinite(rect.width)
    || !Number.isFinite(rect.height)
  ) {
    return null;
  }

  return {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
  };
};

export const shouldCaptureClick = (event: MouseEvent) => {
  if (!event.isTrusted || event.button !== 0) {
    return false;
  }

  const element = findElement(event.target);
  if (!element) {
    return false;
  }

  return !element.closest(sensitive_field_selector);
};

export const buildClickCaptureMessage = (event: MouseEvent): PageClickCaptureMessage | null => {
  if (!shouldCaptureClick(event)) {
    return null;
  }

  const element = findElement(event.target);
  if (!element) {
    return null;
  }

  return {
    type: "demo_composer:page_click",
    payload: {
      page_url: location.href || null,
      page_title: truncateSafeText(document.title),
      target_text: truncateSafeText(element.textContent),
      target_role: roleForElement(element),
      target_test_id: testIdForElement(element),
      target_selector: selectorForElement(element),
      client_x: event.clientX,
      client_y: event.clientY,
      viewport_width: numberOrNull(window.innerWidth),
      viewport_height: numberOrNull(window.innerHeight),
      device_pixel_ratio: numberOrNull(window.devicePixelRatio),
      bounding_box: boundingBoxForElement(element),
    },
  };
};

export const installClickCaptureListener = (
  sendMessage: (message: PageClickCaptureMessage) => void = (message) => {
    (globalThis as {
      chrome?: {
        runtime?: {
          sendMessage?: (payload: PageClickCaptureMessage) => void;
        };
      };
    }).chrome?.runtime?.sendMessage?.(message);
  }
) => {
  const handleClick = (event: MouseEvent) => {
    const message = buildClickCaptureMessage(event);
    if (message) {
      sendMessage(message);
    }
  };

  document.addEventListener("click", handleClick, true);

  return () => {
    document.removeEventListener("click", handleClick, true);
  };
};
