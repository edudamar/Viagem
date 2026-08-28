import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, Download, Share2, MessageCircle } from "lucide-react";
import { Modal } from "./Modal";
import { compressFotos } from "@/utils/compress";
import { fmtMoney } from "@/utils/helpers";
import type { Viagem } from "@/types";

function stripFotos(v: Viagem): Viagem {
  const copy = { ...v };
  copy.dias = v.dias.map((d) => ({
    ...d,
    atividades: d.atividades.map((a) => ({ ...a, fotos: [] })),
  }));
  return copy;
}

function buildQRData(v: Viagem, fotosIncluded: number): string {
  return JSON.stringify({ v, f: fotosIncluded, t: Date.now() });
}

function buildWhatsAppText(v: Viagem): string {
  const totalGasto = v.lancamentos.filter((l) => l.tipo === "despesa").reduce((s, l) => s + l.valor, 0);
  const totalAtividades = v.dias.reduce((s, d) => s + d.atividades.length, 0);
  const dias = v.dias.length;
  const checklistDone = v.checklist.filter((c) => c.done).length;

  let text = `✈ *${v.destino}*\n`;
  text += `📅 ${v.inicio} a ${v.fim} (${dias} dias)\n`;
  text += `💰 Orçamento: ${fmtMoney(v.orcamento)}\n`;
  text += `💸 Gasto: ${fmtMoney(totalGasto)}\n`;
  text += `🎯 ${totalAtividades} atividades planejadas\n`;
  text += `✅ Checklist: ${checklistDone}/${v.checklist.length}\n`;
  text += `\n_Para importar esta viagem, abra o app e clique em Importar._`;

  return text;
}

function buildBackupJSON(v: Viagem): string {
  const stripped = stripFotos(v);
  return JSON.stringify(stripped);
}

export function QRCodeModal({ open, onClose, viagem }: { open: boolean; onClose: () => void; viagem: Viagem | null }) {
  const [qrData, setQrData] = useState("");
  const [loading, setLoading] = useState(false);
  const [fotosInfo, setFotosInfo] = useState("");
  const [activeTab, setActiveTab] = useState<"qr" | "whatsapp">("qr");
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!viagem || !open) return;
    setLoading(true);
    setFotosInfo("");
    setActiveTab("qr");

    const allFotos = viagem.dias.flatMap((d) => d.atividades.flatMap((a) => a.fotos ?? []));

    if (allFotos.length === 0) {
      setQrData(buildQRData(viagem, 0));
      setLoading(false);
      return;
    }

    compressFotos(allFotos).then((compressed) => {
      const vCopy = { ...viagem };
      let fotoIdx = 0;
      vCopy.dias = viagem.dias.map((d) => ({
        ...d,
        atividades: d.atividades.map((a) => {
          const count = a.fotos?.length ?? 0;
          const fotos = compressed.slice(fotoIdx, fotoIdx + count);
          fotoIdx += count;
          return { ...a, fotos };
        }),
      }));

      const data = buildQRData(vCopy, compressed.length);
      if (data.length > 4000) {
        setQrData(buildQRData(stripFotos(viagem), 0));
        setFotosInfo("Fotos removidas (dados grandes demais)");
      } else {
        setQrData(data);
        setFotosInfo(`${compressed.length}/${allFotos.length} fotos incluídas`);
      }
      setLoading(false);
    });
  }, [viagem, open]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const svg = canvasRef.current.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 300, 300);
      const a = document.createElement("a");
      a.download = `qr_${viagem?.destino ?? "viagem"}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleShare = async () => {
    if (!viagem) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Viagem: ${viagem.destino}`, text: `Dados da viagem para ${viagem.destino}` });
      } catch { /* cancelled */ }
    }
  };

  const handleWhatsApp = () => {
    if (!viagem) return;
    const text = encodeURIComponent(buildWhatsAppText(viagem));
    window.location.href = `https://wa.me/?text=${text}`;
  };

  const handleWhatsAppBackup = () => {
    if (!viagem) return;
    const json = buildBackupJSON(viagem);
    const text = encodeURIComponent(`✈ *Backup: ${viagem.destino}*\n\n\`\`\`json\n${json}\n\`\`\``);
    window.location.href = `https://wa.me/?text=${text}`;
  };

  const handleCopyBackup = async () => {
    if (!viagem) return;
    const json = buildBackupJSON(viagem);
    try {
      await navigator.clipboard.writeText(json);
      alert("Backup copiado!");
    } catch { /* fallback */ }
  };

  return (
    <Modal open={open} onClose={onClose} title="Compartilhar Viagem">
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <button onClick={() => setActiveTab("qr")} className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${activeTab === "qr" ? "bg-primary text-white" : "bg-gray-100"}`}>QR Code</button>
          <button onClick={() => setActiveTab("whatsapp")} className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${activeTab === "whatsapp" ? "bg-green-500 text-white" : "bg-gray-100"}`}>WhatsApp</button>
        </div>

        {activeTab === "qr" ? (
          loading ? (
            <div className="py-8 text-sm text-gray-500 text-center">Preparando dados...</div>
          ) : (
            <>
              <div className="flex justify-center" ref={canvasRef}>
                <div className="bg-white rounded-xl p-4">
                  <QRCodeSVG value={qrData} size={200} level="M" includeMargin />
                </div>
              </div>
              {fotosInfo && <p className="text-xs text-gray-500 text-center">{fotosInfo}</p>}
              <p className="text-text-muted text-xs text-center">
                Escaneie com outro dispositivo para importar
              </p>
              <div className="flex gap-2">
                <button onClick={handleDownload} className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-gray-50">
                  <Download className="h-4 w-4" /> Baixar
                </button>
                {"share" in navigator && (
                  <button onClick={handleShare} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-dark">
                    <Share2 className="h-4 w-4" /> Compartilhar
                  </button>
                )}
              </div>
            </>
          )
        ) : (
          <>
            <p className="text-text-muted text-sm text-center">
              Envie os dados da viagem pelo WhatsApp
            </p>
            <button onClick={handleWhatsApp} className="flex items-center justify-center gap-2 rounded-lg bg-green-500 py-3 text-sm font-medium text-white hover:bg-green-600">
              <MessageCircle className="h-5 w-5" /> Enviar Resumo no WhatsApp
            </button>
            <button onClick={handleWhatsAppBackup} className="flex items-center justify-center gap-2 rounded-lg border border-green-500 py-3 text-sm font-medium text-green-600 hover:bg-green-50">
              <MessageCircle className="h-5 w-5" /> Enviar Backup Completo
            </button>
            <button onClick={handleCopyBackup} className="flex items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-gray-50">
              Copiar JSON do Backup
            </button>
            <p className="text-xs text-gray-400 text-center">
              O backup contém todos os dados (sem fotos) e pode ser importado pelo app
            </p>
          </>
        )}
      </div>
    </Modal>
  );
}
