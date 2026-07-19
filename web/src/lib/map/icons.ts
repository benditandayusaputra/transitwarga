/** Ikon marker per jenis usaha, digambar runtime via canvas.

Tanpa aset/sprite eksternal: deterministik, jalan offline, lolos CSP 'self'.
Bentuk pin berwarna sesuai JENIS_COLORS dengan glif putih sederhana per jenis
(mangkuk, gerobak, tenda, cangkir, garpu-pisau, burger). Ikon harus di-add
ulang setiap ganti style basemap (setStyle menghapus image).
*/

import type { Map as MaplibreMap } from 'maplibre-gl';
import type { JenisTempat } from '$lib/types';
import { JENIS_COLORS } from './layers';

export const USAHA_ICON_PREFIX = 'jenis-';

const W = 36;
const H = 46;
const CX = 18;
const CY = 16;
const R = 13;

type Ctx = CanvasRenderingContext2D;

function gambarPin(ctx: Ctx, warna: string): void {
	ctx.beginPath();
	ctx.arc(CX, CY, R, Math.PI * 0.75, Math.PI * 0.25);
	ctx.lineTo(CX, H - 3);
	ctx.closePath();
	ctx.fillStyle = warna;
	ctx.fill();
	ctx.lineWidth = 2;
	ctx.strokeStyle = '#ffffff';
	ctx.stroke();
}

function siapGlif(ctx: Ctx): void {
	ctx.strokeStyle = '#ffffff';
	ctx.fillStyle = '#ffffff';
	ctx.lineWidth = 2.2;
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
}

const GLIF: Record<JenisTempat, (ctx: Ctx) => void> = {
	// mangkuk + uap
	kaki_lima: (ctx) => {
		ctx.beginPath();
		ctx.arc(CX, CY - 1, 7, 0, Math.PI);
		ctx.closePath();
		ctx.fill();
		ctx.beginPath();
		ctx.moveTo(CX - 8, CY - 1);
		ctx.lineTo(CX + 8, CY - 1);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(CX - 3, CY - 8);
		ctx.lineTo(CX - 3, CY - 5);
		ctx.moveTo(CX + 3, CY - 8);
		ctx.lineTo(CX + 3, CY - 5);
		ctx.stroke();
	},
	// gerobak: kotak + dua roda
	gerobak: (ctx) => {
		ctx.strokeRect(CX - 7, CY - 7, 14, 9);
		ctx.beginPath();
		ctx.arc(CX - 4, CY + 5.5, 2.4, 0, Math.PI * 2);
		ctx.arc(CX + 4, CY + 5.5, 2.4, 0, Math.PI * 2);
		ctx.fill();
	},
	// tenda: segitiga + tiang
	warung_tenda: (ctx) => {
		ctx.beginPath();
		ctx.moveTo(CX - 8, CY + 6);
		ctx.lineTo(CX, CY - 7);
		ctx.lineTo(CX + 8, CY + 6);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(CX, CY - 2);
		ctx.lineTo(CX, CY + 6);
		ctx.stroke();
	},
	// cangkir + gagang
	kafe: (ctx) => {
		ctx.strokeRect(CX - 6, CY - 5, 9, 10);
		ctx.beginPath();
		ctx.arc(CX + 5, CY, 3.4, -Math.PI / 2, Math.PI / 2);
		ctx.stroke();
	},
	// garpu & pisau
	restoran: (ctx) => {
		ctx.beginPath();
		ctx.moveTo(CX - 4, CY - 7);
		ctx.lineTo(CX - 4, CY + 7);
		ctx.moveTo(CX - 6.5, CY - 7);
		ctx.lineTo(CX - 6.5, CY - 3);
		ctx.moveTo(CX - 1.5, CY - 7);
		ctx.lineTo(CX - 1.5, CY - 3);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(CX + 4.5, CY - 7);
		ctx.lineTo(CX + 4.5, CY + 7);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(CX + 4.5, CY - 7);
		ctx.quadraticCurveTo(CX + 8, CY - 4, CX + 4.5, CY - 0.5);
		ctx.fill();
	},
	// burger: tiga lapis
	fast_food: (ctx) => {
		ctx.beginPath();
		ctx.arc(CX, CY - 2, 7, Math.PI, 0);
		ctx.fill();
		ctx.fillRect(CX - 7, CY, 14, 2.6);
		ctx.beginPath();
		ctx.roundRect(CX - 7, CY + 4, 14, 2.8, 1.4);
		ctx.fill();
	}
};

function buatIkon(jenis: JenisTempat, pixelRatio = 2): ImageData | null {
	const canvas = document.createElement('canvas');
	canvas.width = W * pixelRatio;
	canvas.height = H * pixelRatio;
	const ctx = canvas.getContext('2d');
	if (!ctx) return null;
	ctx.scale(pixelRatio, pixelRatio);
	gambarPin(ctx, JENIS_COLORS[jenis]);
	siapGlif(ctx);
	GLIF[jenis](ctx);
	return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/** Pastikan semua ikon jenis terpasang di peta (idempoten; panggil ulang tiap ganti style). */
export function ensureMapIcons(map: MaplibreMap): void {
	for (const jenis of Object.keys(GLIF) as JenisTempat[]) {
		const nama = `${USAHA_ICON_PREFIX}${jenis}`;
		if (map.hasImage(nama)) continue;
		const img = buatIkon(jenis);
		if (img) map.addImage(nama, img, { pixelRatio: 2 });
	}
}
