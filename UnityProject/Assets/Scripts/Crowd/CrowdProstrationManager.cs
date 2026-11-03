using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using ChanhDien.Core;

namespace ChanhDien.Crowd
{
    public class DiscipleSlot
    {
        public int slotIndex;
        public bool isVip;
        public string uniqueId;
        public string nickname;
        public Transform root;
        public Transform upperBodyPivot;
        public Transform handsPivot;
        public Transform headAnchor;
        public List<Renderer> renderers = new List<Renderer>();
    }

    public class CrowdProstrationManager : MonoBehaviour
    {
        public static CrowdProstrationManager Instance { get; private set; }

        [Header("Prostration Cycle Config")]
        public float cycleDuration = 7.0f;
        public int bowCycleCount { get; private set; } = 1;
        public event System.Action<int> OnBowCycleIncremented;

        private readonly List<DiscipleSlot> _vipSlots = new List<DiscipleSlot>();
        private readonly List<DiscipleSlot> _crowdSlots = new List<DiscipleSlot>();
        private Transform _centralAbbotRoot;
        private Transform _soloWalkerRoot;

        private Material _matGreyRobe;
        private Material _matSaffronRobe;
        private Material _matSkin;
        private float _cycleTimer;
        private bool _isSpotlightActive;

        private void Awake()
        {
            Instance = this;
            Shader lit = Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard");
            _matGreyRobe = CreateMat(lit, "#54595E", 0.12f);
            _matSaffronRobe = CreateMat(lit, "#D99B26", 0.25f);
            _matSkin = CreateMat(lit, "#D8A984", 0.35f);

            SpawnCentralSaffronAbbot();
            SpawnVipAndCrowdGrid();
        }

        private Material CreateMat(Shader s, string hex, float smoothness)
        {
            ColorUtility.TryParseHtmlString(hex, out Color c);
            Material m = new Material(s) { color = c };
            if (m.HasProperty("_BaseColor")) m.SetColor("_BaseColor", c);
            if (m.HasProperty("_Smoothness")) m.SetFloat("_Smoothness", smoothness);
            return m;
        }

        private void SpawnCentralSaffronAbbot()
        {
            // Vị Chủ Lễ mặc y Ca-sa vàng cam đứng chính giữa lối đi
            _centralAbbotRoot = new GameObject("Central_Saffron_Abbot").transform;
            _centralAbbotRoot.SetParent(transform, false);
            _centralAbbotRoot.localPosition = new Vector3(0f, 0f, 5.2f);

            GameObject robeBody = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            robeBody.transform.SetParent(_centralAbbotRoot, false);
            robeBody.transform.localPosition = new Vector3(0f, 0.85f, 0f);
            robeBody.transform.localScale = new Vector3(0.52f, 0.85f, 0.38f);
            robeBody.GetComponent<Renderer>().sharedMaterial = _matSaffronRobe;

            GameObject head = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            head.transform.SetParent(_centralAbbotRoot, false);
            head.transform.localPosition = new Vector3(0f, 1.88f, 0f);
            head.transform.localScale = new Vector3(0.28f, 0.32f, 0.28f);
            head.GetComponent<Renderer>().sharedMaterial = _matSkin;
        }

        private void SpawnVipAndCrowdGrid()
        {
            // 5 Vị trí Đệm VIP hàng đầu sát bàn thờ
            float[] vipX = { -3.2f, -1.8f, 1.8f, 3.2f, -4.6f };
            for (int i = 0; i < 5; i++)
            {
                DiscipleSlot vip = CreateKneelingDisciple($"VIP_Seat_{i + 1}", new Vector3(vipX[i], 0f, 4.3f), true, i);
                vip.nickname = $"Đại Thí Chủ #{i + 1}";
                _vipSlots.Add(vip);
            }

            // 64 Phật tử áo tràng xám chia 2 bên Trái & Phải (4 cột x 8 hàng mỗi bên)
            int index = 0;
            for (int row = 0; row < 8; row++)
            {
                float zPos = 3.0f - row * 1.45f;
                for (int col = 0; col < 4; col++)
                {
                    float leftX = -1.75f - col * 1.35f;
                    DiscipleSlot leftSlot = CreateKneelingDisciple($"Disciple_L_{row}_{col}", new Vector3(leftX, 0f, zPos), false, index++);
                    _crowdSlots.Add(leftSlot);

                    float rightX = 1.75f + col * 1.35f;
                    DiscipleSlot rightSlot = CreateKneelingDisciple($"Disciple_R_{row}_{col}", new Vector3(rightX, 0f, zPos), false, index++);
                    _crowdSlots.Add(rightSlot);
                }
            }
        }

        private DiscipleSlot CreateKneelingDisciple(string objName, Vector3 position, bool isVip, int slotIndex)
        {
            DiscipleSlot slot = new DiscipleSlot { slotIndex = slotIndex, isVip = isVip };
            GameObject root = new GameObject(objName);
            root.transform.SetParent(transform, false);
            root.transform.localPosition = position;
            slot.root = root.transform;

            // Phần chân quỳ & 2 lòng bàn chân dựng phía sau (đúng tư thế trong ảnh mẫu)
            GameObject legs = GameObject.CreatePrimitive(PrimitiveType.Cube);
            legs.transform.SetParent(root.transform, false);
            legs.transform.localPosition = new Vector3(0f, 0.16f, 0f);
            legs.transform.localScale = new Vector3(0.44f, 0.28f, 0.56f);
            Renderer legR = legs.GetComponent<Renderer>();
            legR.sharedMaterial = _matGreyRobe;
            slot.renderers.Add(legR);

            for (int side = -1; side <= 1; side += 2)
            {
                GameObject foot = GameObject.CreatePrimitive(PrimitiveType.Cube);
                foot.transform.SetParent(root.transform, false);
                foot.transform.localPosition = new Vector3(side * 0.12f, 0.15f, -0.30f);
                foot.transform.localRotation = Quaternion.Euler(14f, 0f, 0f);
                foot.transform.localScale = new Vector3(0.10f, 0.24f, 0.08f);
                Renderer footR = foot.GetComponent<Renderer>();
                footR.sharedMaterial = _matSkin;
                slot.renderers.Add(footR);
            }

            // Khớp thân trên gập xuống khi lạy
            GameObject upperPivot = new GameObject("UpperBody_Pivot");
            upperPivot.transform.SetParent(root.transform, false);
            upperPivot.transform.localPosition = new Vector3(0f, 0.28f, 0.05f);
            slot.upperBodyPivot = upperPivot.transform;

            GameObject torso = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            torso.transform.SetParent(upperPivot.transform, false);
            torso.transform.localPosition = new Vector3(0f, 0.34f, 0f);
            torso.transform.localScale = new Vector3(0.42f, 0.38f, 0.30f);
            Renderer torsoR = torso.GetComponent<Renderer>();
            torsoR.sharedMaterial = _matGreyRobe;
            slot.renderers.Add(torsoR);

            GameObject head = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            head.transform.SetParent(upperPivot.transform, false);
            head.transform.localPosition = new Vector3(0f, 0.82f, 0.02f);
            head.transform.localScale = new Vector3(0.24f, 0.27f, 0.24f);
            Renderer headR = head.GetComponent<Renderer>();
            headR.sharedMaterial = _matSkin;
            slot.renderers.Add(headR);

            // Hai tay chắp lễ (Anjali Mudra)
            GameObject hands = GameObject.CreatePrimitive(PrimitiveType.Cube);
            hands.transform.SetParent(upperPivot.transform, false);
            hands.transform.localPosition = new Vector3(0f, 0.44f, 0.22f);
            hands.transform.localRotation = Quaternion.Euler(-32f, 0f, 0f);
            hands.transform.localScale = new Vector3(0.10f, 0.22f, 0.14f);
            Renderer handR = hands.GetComponent<Renderer>();
            handR.sharedMaterial = _matSkin;
            slot.handsPivot = hands.transform;
            slot.renderers.Add(handR);

            GameObject anchor = new GameObject("Head_UI_Anchor");
            anchor.transform.SetParent(upperPivot.transform, false);
            anchor.transform.localPosition = new Vector3(0f, 1.18f, 0f);
            slot.headAnchor = anchor.transform;

            return slot;
        }

        private void Update()
        {
            _cycleTimer += Time.deltaTime;
            if (_cycleTimer >= cycleDuration)
            {
                _cycleTimer -= cycleDuration;
                bowCycleCount++;
                OnBowCycleIncremented?.Invoke(bowCycleCount);
            }

            float bowAngle = EvaluateBowAngle(_cycleTimer);
            Quaternion targetRot = Quaternion.Euler(bowAngle, 0f, 0f);

            foreach (DiscipleSlot s in _vipSlots) s.upperBodyPivot.localRotation = targetRot;
            foreach (DiscipleSlot s in _crowdSlots) s.upperBodyPivot.localRotation = targetRot;
        }

        private float EvaluateBowAngle(float t)
        {
            // 4 giai đoạn: Quỳ thẳng (0-2s) -> Cúi lạy sát đất (2-3.5s) -> Giữ (3.5-5s) -> Ngồi dậy (5-7s)
            if (t < 2.0f) return 5.0f + Mathf.Sin(t * Mathf.PI) * 2.0f;
            if (t < 3.5f) return Mathf.SmoothStep(5.0f, 68.0f, (t - 2.0f) / 1.5f);
            if (t < 5.0f) return 68.0f;
            return Mathf.SmoothStep(68.0f, 5.0f, (t - 5.0f) / 2.0f);
        }

        public void TriggerSpotlightIncense(SpotlightIncensePayload payload)
        {
            if (!_isSpotlightActive)
            {
                StartCoroutine(SpotlightRitualRoutine(payload));
            }
        }

        private IEnumerator SpotlightRitualRoutine(SpotlightIncensePayload payload)
        {
            _isSpotlightActive = true;
            SetCrowdVisibility(false);

            // Nhân vật người tặng quà bước đi dọc lối đi chính giữa lên vị trí Chủ Lễ
            Vector3 startPos = new Vector3(0f, 0f, -6.5f);
            Vector3 endPos = new Vector3(0f, 0f, 4.8f);
            float walkDuration = 2.0f;
            float elapsed = 0f;

            while (elapsed < walkDuration)
            {
                elapsed += Time.deltaTime;
                _centralAbbotRoot.localPosition = Vector3.Lerp(startPos, endPos, elapsed / walkDuration);
                yield return null;
            }

            yield return new WaitForSeconds(2.5f);
            _centralAbbotRoot.localPosition = new Vector3(0f, 0f, 5.2f);
            SetCrowdVisibility(true);
            _isSpotlightActive = false;
        }

        private void SetCrowdVisibility(bool visible)
        {
            foreach (DiscipleSlot s in _vipSlots) s.root.gameObject.SetActive(visible);
            foreach (DiscipleSlot s in _crowdSlots) s.root.gameObject.SetActive(visible);
        }

        public Transform GetDiscipleHeadAnchor(int slotIndex, bool isVip)
        {
            if (isVip && slotIndex >= 0 && slotIndex < _vipSlots.Count) return _vipSlots[slotIndex].headAnchor;
            if (slotIndex >= 0 && slotIndex < _crowdSlots.Count) return _crowdSlots[slotIndex].headAnchor;
            return _centralAbbotRoot;
        }
    }
}
