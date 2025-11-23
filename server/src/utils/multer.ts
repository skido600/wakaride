import multer from "multer";
import path from "path";
import fs from "fs";

const uploadPath = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadPath),
  filename: (_req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const fileFilter = (_req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("File type not supported. Images only!"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export default upload;
