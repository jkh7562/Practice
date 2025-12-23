import React, { useRef, useEffect, useState } from 'react';
// OpenLayers 핵심 모듈
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import Draw from 'ol/interaction/Draw';
import Overlay from 'ol/Overlay';
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
import { fromLonLat } from 'ol/proj';
import 'ol/ol.css';

const OpenLayersComponent = () => {
    // 1. 지도를 렌더링할 <div> 요소를 참조하기 위해 useRef 사용
    const mapRef = useRef(); 
    // 지도 인스턴스를 저장할 ref
    const mapInstanceRef = useRef(null);
    // 벡터 소스를 저장할 ref (그려진 피쳐 저장소)
    const vectorSourceRef = useRef(new VectorSource());
    // 현재 그리기 모드 interaction을 저장할 ref
    const drawInteractionRef = useRef(null);
    // 오버레이 인스턴스를 저장할 ref
    const overlayInstanceRef = useRef(null);
    // 오버레이 컨테이너 DIV 참조
    const overlayRef = useRef(null);

    // 현재 선택된 그리기 타입 상태 ('Point', 'LineString', 'Polygon', null)
    const [activeType, setActiveType] = useState(null);
    // 현재 선택된 피쳐 상태
    const [selectedFeature, setSelectedFeature] = useState(null);

    // 피쳐 삭제 핸들러
    const handleDeleteFeature = () => {
        if (selectedFeature && vectorSourceRef.current) {
            vectorSourceRef.current.removeFeature(selectedFeature);
            setSelectedFeature(null);
            overlayInstanceRef.current.setPosition(undefined); // 오버레이 숨김
        }
    };

    // 2. 컴포넌트 마운트 시 지도 초기화 (최초 1회만)
    useEffect(() => {
        // 기본 지도 레이어 설정
        const osmLayer = new TileLayer({
            source: new OSM(),
        });

        // 사용자가 그린 피쳐를 보여줄 벡터 레이어
        const vectorLayer = new VectorLayer({
            source: vectorSourceRef.current,
            style: new Style({
                fill: new Fill({
                    color: 'rgba(255, 255, 255, 0.2)',
                }),
                stroke: new Stroke({
                    color: '#0008efff',
                    width: 2,
                }),
                image: new CircleStyle({
                    radius: 7,
                    fill: new Fill({
                        color: '#0008efff',
                    }),
                }),
            }),
        });

        // 오버레이 생성
        const overlay = new Overlay({
            element: overlayRef.current,
            positioning: 'center-center',
            stopEvent: true, // 오버레이 클릭 시 지도 이벤트 전파 방지
        });
        overlayInstanceRef.current = overlay;

        // 지도 객체 생성
        const map = new Map({
            target: mapRef.current, // ⬅️ useRef로 참조된 DOM 요소에 연결
            layers: [osmLayer, vectorLayer],
            overlays: [overlay], // 오버레이 추가
            view: new View({
                center: fromLonLat([126.9780, 37.5665]), // 서울
                zoom: 10,
            }),
        });

        // 지도 클릭 이벤트 리스너
        map.on('click', (event) => {
            // 클릭한 위치에 피쳐가 있는지 확인
            const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => feature);

            if (feature) {
                // 피쳐를 클릭한 경우
                setSelectedFeature(feature);
                // 클릭한 위치(좌표)에 오버레이 표시
                overlay.setPosition(event.coordinate);
            } else {
                // 빈 곳을 클릭한 경우
                setSelectedFeature(null);
                overlay.setPosition(undefined); // 오버레이 숨김
            }
        });

        mapInstanceRef.current = map;

        // 3. Cleanup 함수: 컴포넌트가 사라질 때 지도 객체 연결 해제 (메모리 누수 방지)
        return () => {
            map.setTarget(undefined);
            mapInstanceRef.current = null;
        };
    }, []); // ⬅️ 의존성 배열이 비어 있어 마운트 시에만 실행

    // 그리기 인터랙션 관리
    useEffect(() => {
        if (!mapInstanceRef.current) return;

        // 기존 인터랙션 제거
        if (drawInteractionRef.current) {
            mapInstanceRef.current.removeInteraction(drawInteractionRef.current);
            drawInteractionRef.current = null;
        }

        // 새로운 그리기 모드가 선택되었다면 인터랙션 추가
        if (activeType) {
            const draw = new Draw({
                source: vectorSourceRef.current,
                type: activeType,
            });
            
            // 그리기 종료 시 이벤트 핸들러
            draw.on('drawend', (event) => {
                const feature = event.feature;
                // 약간의 지연 후 처리 (피쳐가 소스에 완전히 추가된 후)
                setTimeout(() => {
                    setSelectedFeature(feature);
                    
                    // 피쳐의 종류에 따라 오버레이 위치 결정
                    const geometry = feature.getGeometry();
                    let coordinate;
                    
                    if (geometry.getType() === 'Point') {
                        coordinate = geometry.getCoordinates();
                    } else if (geometry.getType() === 'Polygon') {
                         // 폴리곤은 내부 점(interior point) 사용
                         coordinate = geometry.getInteriorPoint().getCoordinates();
                    } else {
                        // 라인 등은 마지막 좌표 사용
                        coordinate = geometry.getLastCoordinate();
                    }
                    
                    if (overlayInstanceRef.current) {
                        overlayInstanceRef.current.setPosition(coordinate);
                    }
                }, 0);
            });

            mapInstanceRef.current.addInteraction(draw);
            drawInteractionRef.current = draw;
        }
    }, [activeType]);

    // 초기화 함수
    const handleClear = () => {
        vectorSourceRef.current.clear();
        setSelectedFeature(null);
        if (overlayInstanceRef.current) {
            overlayInstanceRef.current.setPosition(undefined);
        }
    };

    // 4. 렌더링: ref를 연결하고 크기를 지정한 <div> 반환 및 컨트롤 버튼
    return (
        <div className="relative w-full h-[100vh]">
            <div 
                ref={mapRef} 
                className="w-full h-full"
            />
            
            {/* 오버레이 (삭제 버튼) */}
            <div 
                ref={overlayRef} 
                className="absolute bg-white rounded-full p-1 shadow-md cursor-pointer hover:bg-red-100 transition-transform hover:scale-110"
                style={{ transform: 'translate(-50%, -50%)' }} // 중심점 맞춤
                onClick={handleDeleteFeature}
            >
                {selectedFeature && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                )}
            </div>

            {/* UI 컨트롤 패널 */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg z-50 flex gap-2">
                <button 
                    className={`px-4 py-2 rounded transition-colors duration-200 font-medium ${activeType === 'Point' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                    onClick={() => setActiveType('Point')}
                >
                    점 (Point)
                </button>
                <button 
                    className={`px-4 py-2 rounded transition-colors duration-200 font-medium ${activeType === 'LineString' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                    onClick={() => setActiveType('LineString')}
                >
                    선 (Line)
                </button>
                <button 
                    className={`px-4 py-2 rounded transition-colors duration-200 font-medium ${activeType === 'Polygon' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                    onClick={() => setActiveType('Polygon')}
                >
                    면 (Polygon)
                </button>
                <button 
                    className={`px-4 py-2 rounded transition-colors duration-200 font-medium ${activeType === null ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                    onClick={() => setActiveType(null)}
                >
                    이동 (None)
                </button>
                <div className="w-px bg-gray-300 mx-1"></div>
                <button 
                    className="px-4 py-2 rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors duration-200 font-medium"
                    onClick={handleClear}
                >
                    초기화
                </button>
            </div>
        </div>
    );
};

export default OpenLayersComponent;