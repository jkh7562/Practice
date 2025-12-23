import React, { useEffect, useRef } from 'react';
import { Ion, Viewer } from 'cesium';
import "cesium/Build/Cesium/Widgets/widgets.css";

Ion.defaultAccessToken = process.env.REACT_APP_CESIUM_ION_TOKEN;

const CesiumComponent = () => {
    const cesiumContainer = useRef(null);

    useEffect(() => {
        if (cesiumContainer.current) {
            // Cesium Viewer 초기화
            // 기본 위젯들이 포함된 전체 뷰어 생성
            const viewer = new Viewer(cesiumContainer.current, {
                animation: false, // 하단 애니메이션 위젯 숨김 (선택사항)
                timeline: false,  // 하단 타임라인 위젯 숨김 (선택사항)
            });

            // Cleanup 함수: 컴포넌트 해제 시 뷰어 파괴
            return () => {
                if (viewer && !viewer.isDestroyed()) {
                    viewer.destroy();
                }
            };
        }
    }, []);

    return (
        <div
            ref={cesiumContainer}
            style={{ width: "100%", height: "100vh" }}
        />
    );
};

export default CesiumComponent;
