import { describe, expect, it } from 'vitest';
import {
	activitiesToGeoJson,
	DEFAULT_JABODETABEK_POLYGON,
	DEFAULT_MAPID_KEY,
	getUserAvatar,
	type MapidActivity
} from './mapidActivities';

describe('mapidActivities service', () => {
	it('memiliki API key dan polygon default', () => {
		expect(DEFAULT_MAPID_KEY).toBe('6a919d9453df37905b3a5d49');
		expect(DEFAULT_JABODETABEK_POLYGON).toHaveLength(1);
		expect(DEFAULT_JABODETABEK_POLYGON[0]).toHaveLength(5);
	});

	it('ekstraksi avatar pengguna menangani string, object, dan undefined', () => {
		expect(getUserAvatar(undefined)).toBe('');
		expect(getUserAvatar('https://cdn.example.com/avatar.jpg')).toBe(
			'https://cdn.example.com/avatar.jpg'
		);
		expect(
			getUserAvatar({
				url: 'https://cdn.example.com/orig.jpg',
				url_compressed: 'https://cdn.example.com/comp.jpg'
			})
		).toBe('https://cdn.example.com/comp.jpg');
		expect(
			getUserAvatar({
				url: 'https://cdn.example.com/orig.jpg'
			})
		).toBe('https://cdn.example.com/orig.jpg');
	});

	it('mengonversi MapidActivity ke GeoJSON FeatureCollection', () => {
		const sample: MapidActivity[] = [
			{
				_id: 'act-123',
				title: 'Observasi Trotoar Dukuh Atas',
				description: 'PKL tertata di dekat stasiun. #Devunder',
				geometry: {
					type: 'Point',
					coordinates: [106.822, -6.2]
				},
				medias: ['https://cdn.mapid.io/img1.jpg', 'https://cdn.mapid.io/img2.jpg'],
				user_name: 'surveyor1',
				user_full_name: 'Budi Surveyor',
				created_at: '2026-08-23T07:15:14.459Z'
			}
		];

		const geojson = activitiesToGeoJson(sample);
		expect(geojson.type).toBe('FeatureCollection');
		expect(geojson.features).toHaveLength(1);

		const feat = geojson.features[0];
		expect(feat.id).toBe('act-123');
		expect(feat.geometry.coordinates).toEqual([106.822, -6.2]);
		expect(feat.properties.title).toBe('Observasi Trotoar Dukuh Atas');
		expect(feat.properties.medias_count).toBe(2);
		expect(feat.properties.first_media).toBe('https://cdn.mapid.io/img1.jpg');
	});
});
