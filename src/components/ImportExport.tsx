import { useRef } from "react";
import { Button } from "@/components/ui/button";

type ImportExportProps = {
  onImportJSON: (json: unknown) => void;
  dataForExport: unknown;
  fileName?: string;
};

const defaultFileName = "superplanejador_export";

const ImportExport = ({ onImportJSON, dataForExport, fileName = defaultFileName }: ImportExportProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(dataForExport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${fileName}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result ?? "{}"));
        onImportJSON(parsed);
      } catch (error) {
        console.error("Falha ao importar JSON", error);
        window.alert("JSON inválido");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={exportJSON}>
        Exportar JSON
      </Button>
      <Button variant="secondary" onClick={importJSON}>
        Importar JSON
      </Button>
      <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={onFileChange} />
    </div>
  );
};

export default ImportExport;
