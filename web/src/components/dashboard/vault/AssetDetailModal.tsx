import { X, MapPin, Camera, Trash2 } from "lucide-react";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PhysicalAssetRow } from "@shared/types/database";

interface AssetDetailModalProps {
  asset: PhysicalAssetRow;
  signedUrl?: string;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function AssetDetailModal({
  asset,
  signedUrl,
  onClose,
  onDelete,
}: AssetDetailModalProps) {
  return (
    <ModalDialog
      open={true}
      onClose={onClose}
      panelClassName="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl"
    >
      <div className="flex flex-col md:flex-row h-full">
        {/* Left: Image */}
        <div className="w-full md:w-1/2 aspect-square bg-slate-50 relative overflow-hidden shrink-0 border-r border-slate-100 flex items-center justify-center p-4">
          {signedUrl ? (
            <img
              src={signedUrl}
              alt={asset.name}
              className="w-full h-full object-contain drop-shadow-2xl"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
              <Camera className="w-12 h-12 opacity-20" />
              <span className="text-xs font-black uppercase tracking-[0.2em] opacity-40">
                No Photo
              </span>
            </div>
          )}
          <Badge className="absolute top-4 left-4 bg-teal-600 text-white border-none text-[10px] font-black uppercase tracking-widest px-3 py-1 shadow-md">
            {asset.category}
          </Badge>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/90 backdrop-blur-sm text-slate-500 hover:text-slate-900 shadow-sm transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Right: Details */}
        <div className="flex-1 p-8 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                {asset.name}
              </h2>
              {asset.location_in_home && (
                <div className="flex items-center gap-2 text-slate-400">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-bold">
                    {asset.location_in_home}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              {asset.brand && (
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block">
                    Brand
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {asset.brand}
                  </span>
                </div>
              )}
              {asset.color_name && (
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block">
                    Color Name
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {asset.color_name}
                  </span>
                </div>
              )}
              {asset.color_code && (
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block">
                    Color Code
                  </span>
                  <span className="text-sm font-bold text-slate-900 font-mono">
                    {asset.color_code}
                  </span>
                </div>
              )}
              {asset.finish && (
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block">
                    Finish
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {asset.finish}
                  </span>
                </div>
              )}
            </div>

            {asset.notes && (
              <div className="space-y-2 pt-6 border-t border-slate-100">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block">
                  Project Notes
                </span>
                <p className="text-sm text-slate-600 leading-relaxed italic">
                  "{asset.notes}"
                </p>
              </div>
            )}
          </div>

          <div className="pt-8 flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={() => onDelete(asset.id)}
              className="text-rose-600 border-rose-100 hover:bg-rose-50 hover:text-rose-700 font-bold px-4 rounded-xl"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove Spec
            </Button>
            <Button
              onClick={onClose}
              className="bg-slate-900 text-white hover:bg-slate-800 font-black uppercase tracking-widest text-[10px] px-8 rounded-xl"
            >
              Close Preview
            </Button>
          </div>
        </div>
      </div>
    </ModalDialog>
  );
}
