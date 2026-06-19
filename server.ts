import express from "express";
import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Serve the ZIP generated from the actual source files
  app.get("/api/download-zip", (req, res) => {
    try {
      const zip = new AdmZip();
      const projectRoot = process.cwd();

      // Custom recursive function to construct the ZIP keeping structure
      function addFilesRecursively(dirPath: string, baseDirName: string = "") {
        const items = fs.readdirSync(dirPath);
        for (const item of items) {
          // Strict exclusions of temporary / build folders and locks
          if (
            item === "node_modules" ||
            item === "dist" ||
            item === ".git" ||
            item === ".env" ||
            item === ".env.local" ||
            item === ".github" ||
            item === ".idea" ||
            item === ".vscode"
          ) {
            continue;
          }
          const fullPath = path.join(dirPath, item);
          const relativePath = path.join(baseDirName, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            addFilesRecursively(fullPath, relativePath);
          } else if (stat.isFile()) {
            // Normalize path separator to forward slash for correct ZIP formatting
            const normalizedRelativePath = relativePath.replace(/\\/g, "/");

            if (normalizedRelativePath === "src/components/Home.tsx") {
              // Modify Home.tsx on-the-fly to disable the download button in the export
              let content = fs.readFileSync(fullPath, "utf-8");
              content = content.replace(
                "const SHOW_DOWNLOAD_BUTTON = true;",
                "const SHOW_DOWNLOAD_BUTTON = false;"
              );
              zip.addFile(normalizedRelativePath, Buffer.from(content, "utf-8"));
            } else {
              // Add other files keeping folder structure in ZIP
              const parentZipDir = path.dirname(normalizedRelativePath);
              const zipPathInArchive = parentZipDir === "." ? "" : parentZipDir;
              zip.addLocalFile(fullPath, zipPathInArchive);
            }
          }
        }
      }

      addFilesRecursively(projectRoot);

      const buffer = zip.toBuffer();
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", "attachment; filename=homeostasis-app.zip");
      res.send(buffer);
    } catch (err) {
      console.error("Error creating ZIP archive:", err);
      res.status(500).json({ error: "Non è stato possibile generare il file ZIP dell'applicazione" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Export App Data packaged in a ZIP containing data.json
  app.post("/api/export-data-zip", express.json({ limit: "50mb" }), (req, res) => {
    try {
      const data = req.body;
      const zip = new AdmZip();
      zip.addFile("data.json", Buffer.from(JSON.stringify(data, null, 2), "utf-8"));
      const buffer = zip.toBuffer();
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", "attachment; filename=droid-routine-backup.zip");
      res.send(buffer);
    } catch (err) {
      console.error("Error creating data ZIP backup:", err);
      res.status(500).json({ error: "Impossibile generare il file ZIP con i dati" });
    }
  });

  // Import App Data by uploading the ZIP containing data.json
  app.post("/api/import-data-zip", express.raw({ type: "application/zip", limit: "50mb" }), (req, res) => {
    try {
      const zip = new AdmZip(req.body);
      const entry = zip.getEntry("data.json");
      if (!entry) {
        return res.status(400).json({ error: "File data.json non trovato nello ZIP caricato" });
      }
      const dataStr = entry.getData().toString("utf-8");
      const data = JSON.parse(dataStr);
      res.json(data);
    } catch (err) {
      console.error("Error reading data ZIP upload:", err);
      res.status(500).json({ error: "Impossibile decifrare il file ZIP caricato. Assicurarsi che sia un backup valido." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
