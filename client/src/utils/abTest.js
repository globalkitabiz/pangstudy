// 간단한 A/B 그룹 할당 유틸
export function getABVariant() {
    try {
        const key = 'ab_variant';
        let v = localStorage.getItem(key);
        if (v) return v;
        // 50/50 분할
        v = Math.random() < 0.5 ? 'A' : 'B';
        localStorage.setItem(key, v);
        return v;
    } catch (e) {
        return 'A';
    }
}
