const DEFAULT_TOLERANCE = 0.02;

const gcd = (a, b) => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const temp = y;
    y = x % y;
    x = temp;
  }
  return x || 1;
};

export const formatAspectRatio = (width, height) => {
  if (!width || !height) return "";
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
};

export const getImageDimensions = (file) =>
  new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file provided"));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();

    img.onload = () => {
      const { width, height } = img;
      URL.revokeObjectURL(objectUrl);
      resolve({ width, height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Could not read "${file.name}".`));
    };

    img.src = objectUrl;
  });

export const getVideoDimensions = (file) =>
  new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file provided"));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      const { videoWidth, videoHeight } = video;
      URL.revokeObjectURL(objectUrl);
      resolve({ width: videoWidth, height: videoHeight });
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Could not read "${file.name}".`));
    };

    video.src = objectUrl;
  });

export const validateImageAspectRatio = async (
  file,
  expectedDimensions,
  { label = "Image", tolerance = DEFAULT_TOLERANCE } = {},
) => {
  const { width, height } = await getImageDimensions(file);
  if (!width || !height) {
    throw new Error(`Could not determine dimensions for "${file.name}".`);
  }

  const expectedWidth =
    typeof expectedDimensions === "object"
      ? expectedDimensions.width
      : undefined;
  const expectedHeight =
    typeof expectedDimensions === "object"
      ? expectedDimensions.height
      : undefined;

  if (!expectedWidth || !expectedHeight) {
    throw new Error("Expected image dimensions are required.");
  }

  const expectedRatio = expectedWidth / expectedHeight;
  const actualRatio = width / height;
  const diff = Math.abs(actualRatio - expectedRatio) / expectedRatio;

  if (diff > tolerance) {
    const expectedLabel = formatAspectRatio(expectedWidth, expectedHeight);
    const actualLabel = formatAspectRatio(width, height);
    throw new Error(
      `${label} must be in ${expectedLabel} ratio. Uploaded image is ${width}×${height}px (${actualLabel}).`,
    );
  }

  return { width, height };
};

export const getRatioLabel = (width, height) => formatAspectRatio(width, height);

export const validateVideoAspectRatio = async (
  file,
  expectedDimensions,
  options = {},
) => {
  const { width, height } = await getVideoDimensions(file);
  if (!width || !height) {
    throw new Error(`Could not determine dimensions for "${file.name}".`);
  }

  const expectedWidth =
    typeof expectedDimensions === "object"
      ? expectedDimensions.width
      : undefined;
  const expectedHeight =
    typeof expectedDimensions === "object"
      ? expectedDimensions.height
      : undefined;

  if (!expectedWidth || !expectedHeight) {
    throw new Error("Expected video dimensions are required.");
  }

  const expectedRatio = expectedWidth / expectedHeight;
  const actualRatio = width / height;
  const diff = Math.abs(actualRatio - expectedRatio) / expectedRatio;
  const tolerance =
    typeof options.tolerance === "number" ? options.tolerance : DEFAULT_TOLERANCE;

  if (diff > tolerance) {
    const expectedLabel = formatAspectRatio(expectedWidth, expectedHeight);
    const actualLabel = formatAspectRatio(width, height);
    throw new Error(
      `${options.label || "Video"} must be in ${expectedLabel} ratio. Uploaded video is ${width}×${height}px (${actualLabel}).`,
    );
  }

  return { width, height };
};
