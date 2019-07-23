import Color from "tinycolor2";

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", event => reject(event));
    image.src = src;
  });

const originalPromise = loadImage("/favicon.png");
const canvas = document.createElement("canvas");
const context = canvas.getContext("2d")!;

const links = Array.from(document.getElementsByTagName("link"));
const faviconLink = links.find(l => l.type === "image/x-icon");

// Get the drawing context
export async function setFaviconColor(color: Color.Instance) {
  if (faviconLink === undefined) return
  const favicon = await originalPromise;
  canvas.width = favicon.width;
  canvas.height = favicon.height;
  context.drawImage(favicon, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const { r, g, b } = color.toRgb()
  for (let i = 0; i < imageData.data.length; i += 4) {
    imageData.data[i + 0] = r;
    imageData.data[i + 1] = g;
    imageData.data[i + 2] = b;
  }
  context.putImageData(imageData, 0, 0);
  faviconLink.href = canvas.toDataURL();
}
