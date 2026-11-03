using UnityEngine;
using UnityEngine.Rendering;

namespace ChanhDien.Graphics
{
    public class SanctuaryEnvironmentBuilder : MonoBehaviour
    {
        [Header("Optional Imported FBX Prefabs")]
        public GameObject centerBuddhaPrefab;
        public GameObject sideBuddhaPrefab;

        [Header("Scene Lighting")]
        public Light directionalSunLight;
        public Color sunlightColor = new Color(1.0f, 0.945f, 0.815f); // #FFF1D0
        public float sunIntensity = 2.8f;

        private Material _matPewter;
        private Material _matAntiqueBronze;
        private Material _matMandala;
        private Material _matTempleStone;
        private Material _matSlateFloor;
        private Material _matWindowGlow;
        private Material _matGodRay;

        private void Awake()
        {
            InitializePbrMaterials();
            SetupCinematicLighting();
            BuildSanctuaryArchitecture();
            BuildFiveBuddhasAltar();
            BuildVolumetricGodRays();
        }

        private void InitializePbrMaterials()
        {
            Shader litShader = Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard");

            _matPewter = CreateLitMaterial(litShader, "#8C9295", 0.60f, 0.55f);
            _matAntiqueBronze = CreateLitMaterial(litShader, "#C59B5F", 0.85f, 0.68f);
            _matMandala = CreateLitMaterial(litShader, "#9E7B42", 0.80f, 0.60f);
            _matTempleStone = CreateLitMaterial(litShader, "#7D7B76", 0.05f, 0.15f);
            _matSlateFloor = CreateLitMaterial(litShader, "#686A6C", 0.15f, 0.45f);

            _matWindowGlow = CreateLitMaterial(litShader, "#FFF5D6", 0.0f, 1.0f);
            _matWindowGlow.EnableKeyword("_EMISSION");
            _matWindowGlow.SetColor("_EmissionColor", new Color(1.0f, 0.95f, 0.82f) * 2.4f);

            Shader additiveShader = Shader.Find("Particles/Standard Unlit") ?? Shader.Find("Legacy Shaders/Particles/Additive");
            _matGodRay = new Material(additiveShader);
            _matGodRay.color = new Color(1.0f, 0.93f, 0.76f, 0.085f);
        }

        private Material CreateLitMaterial(Shader shader, string hex, float metallic, float smoothness)
        {
            ColorUtility.TryParseHtmlString(hex, out Color col);
            Material mat = new Material(shader) { color = col };
            if (mat.HasProperty("_BaseColor")) mat.SetColor("_BaseColor", col);
            if (mat.HasProperty("_Metallic")) mat.SetFloat("_Metallic", metallic);
            if (mat.HasProperty("_Smoothness")) mat.SetFloat("_Smoothness", smoothness);
            if (mat.HasProperty("_Glossiness")) mat.SetFloat("_Glossiness", smoothness);
            return mat;
        }

        private void SetupCinematicLighting()
        {
            if (directionalSunLight == null)
            {
                GameObject sunObj = new GameObject("Directional_Sunlight_RightToLeft");
                directionalSunLight = sunObj.AddComponent<Light>();
                directionalSunLight.type = LightType.Directional;
            }

            // Chiếu xiên từ hàng cột bên phải (+X) sang sàn bên trái (-X)
            directionalSunLight.transform.rotation = Quaternion.Euler(24f, -118f, 0f);
            directionalSunLight.color = sunlightColor;
            directionalSunLight.intensity = sunIntensity;
            directionalSunLight.shadows = LightShadows.Soft;
            directionalSunLight.shadowBias = 0.02f;
            directionalSunLight.shadowNormalBias = 0.4f;

            RenderSettings.ambientMode = AmbientMode.Trilight;
            RenderSettings.ambientSkyColor = new Color(0.55f, 0.58f, 0.62f);
            RenderSettings.ambientEquatorColor = new Color(0.45f, 0.43f, 0.40f);
            RenderSettings.ambientGroundColor = new Color(0.28f, 0.27f, 0.25f);
        }

        private void BuildSanctuaryArchitecture()
        {
            GameObject archRoot = new GameObject("Sanctuary_Architecture");
            archRoot.transform.SetParent(transform, false);

            // Sàn gạch đá lớn nhận bóng đổ dài
            GameObject floor = GameObject.CreatePrimitive(PrimitiveType.Plane);
            floor.name = "Slate_Tile_Floor";
            floor.transform.SetParent(archRoot.transform, false);
            floor.transform.localScale = new Vector3(3.6f, 1f, 3.8f);
            floor.GetComponent<Renderer>().sharedMaterial = _matSlateFloor;

            // Tường đá hậu cung
            CreateBox(archRoot.transform, "Back_Stone_Wall", new Vector3(0f, 10f, 12.5f), new Vector3(26f, 20f, 1.2f), _matTempleStone);

            // 2 khung cửa sổ hoa văn phát sáng đối xứng
            for (int side = -1; side <= 1; side += 2)
            {
                float wx = side * 7.4f;
                CreateBox(archRoot.transform, $"Lattice_Window_Glow_{side}", new Vector3(wx, 9.5f, 11.88f), new Vector3(1.5f, 13f, 0.1f), _matWindowGlow);
                for (int r = 0; r < 10; r++)
                {
                    CreateBox(archRoot.transform, $"Window_Bar_{r}", new Vector3(wx, 3.8f + r * 1.2f, 11.82f), new Vector3(1.55f, 0.08f, 0.15f), _matTempleStone);
                }
            }

            // Hàng cột đá 2 bên cánh gà (tạo khe nắng bên phải)
            float[] pillarZ = { -8.0f, -2.5f, 3.0f, 8.5f };
            foreach (float pz in pillarZ)
            {
                CreateBox(archRoot.transform, "Left_Pillar", new Vector3(-11.2f, 9f, pz), new Vector3(1.6f, 18f, 1.6f), _matTempleStone);
                CreateBox(archRoot.transform, "Right_Pillar", new Vector3(11.2f, 9f, pz), new Vector3(1.6f, 18f, 1.6f), _matTempleStone);
            }
        }

        private void BuildFiveBuddhasAltar()
        {
            GameObject altarRoot = new GameObject("Five_Buddhas_Altar");
            altarRoot.transform.SetParent(transform, false);

            // Bệ thờ đá 2 tầng
            CreateBox(altarRoot.transform, "Altar_Step_1", new Vector3(0f, 0.6f, 9.6f), new Vector3(20f, 1.2f, 3.8f), _matTempleStone);
            CreateBox(altarRoot.transform, "Altar_Step_2", new Vector3(0f, 1.5f, 10.2f), new Vector3(18.5f, 0.9f, 2.6f), _matTempleStone);

            // 1 Đại Phật trung tâm + 2 Nhị vị + 2 Tiểu vị
            SpawnProceduralOrPrefabBuddha(altarRoot.transform, "Center_Great_Buddha", new Vector3(0f, 2.0f, 10.2f), 2.5f, true);
            SpawnProceduralOrPrefabBuddha(altarRoot.transform, "Left_Second_Buddha", new Vector3(-4.6f, 1.95f, 10.3f), 1.65f, false);
            SpawnProceduralOrPrefabBuddha(altarRoot.transform, "Right_Second_Buddha", new Vector3(4.6f, 1.95f, 10.3f), 1.65f, false);
            SpawnProceduralOrPrefabBuddha(altarRoot.transform, "Left_Outer_Buddha", new Vector3(-8.2f, 1.95f, 10.5f), 1.05f, false);
            SpawnProceduralOrPrefabBuddha(altarRoot.transform, "Right_Outer_Buddha", new Vector3(8.2f, 1.95f, 10.5f), 1.05f, false);
        }

        private void SpawnProceduralOrPrefabBuddha(Transform parent, string name, Vector3 pos, float scale, bool includeMandala)
        {
            GameObject root = new GameObject(name);
            root.transform.SetParent(parent, false);
            root.transform.localPosition = pos;
            root.transform.localScale = Vector3.one * scale;

            if (includeMandala)
            {
                GameObject mandala = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                mandala.name = "Mandala_Relief_Halo";
                mandala.transform.SetParent(root.transform, false);
                mandala.transform.localPosition = new Vector3(0f, 2.1f, 0.55f);
                mandala.transform.localRotation = Quaternion.Euler(90f, 0f, 0f);
                mandala.transform.localScale = new Vector3(4.2f, 0.08f, 4.2f);
                mandala.GetComponent<Renderer>().sharedMaterial = _matMandala;
            }

            // Đài sen vàng đồng
            GameObject lotusBase = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            lotusBase.transform.SetParent(root.transform, false);
            lotusBase.transform.localPosition = new Vector3(0f, 0.35f, 0f);
            lotusBase.transform.localScale = new Vector3(1.8f, 0.35f, 1.4f);
            lotusBase.GetComponent<Renderer>().sharedMaterial = _matAntiqueBronze;

            // Thân Phật đá bạc + Y áo đồng cổ
            GameObject torso = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            torso.transform.SetParent(root.transform, false);
            torso.transform.localPosition = new Vector3(0f, 1.45f, 0f);
            torso.transform.localScale = new Vector3(1.05f, 1.1f, 0.72f);
            torso.GetComponent<Renderer>().sharedMaterial = _matPewter;

            GameObject robe = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            robe.transform.SetParent(root.transform, false);
            robe.transform.localPosition = new Vector3(-0.08f, 1.38f, -0.02f);
            robe.transform.localRotation = Quaternion.Euler(0f, 0f, -14f);
            robe.transform.localScale = new Vector3(0.95f, 0.85f, 0.76f);
            robe.GetComponent<Renderer>().sharedMaterial = _matAntiqueBronze;

            GameObject head = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            head.transform.SetParent(root.transform, false);
            head.transform.localPosition = new Vector3(0f, 2.55f, 0f);
            head.transform.localScale = new Vector3(0.62f, 0.72f, 0.62f);
            head.GetComponent<Renderer>().sharedMaterial = _matPewter;
        }

        private void BuildVolumetricGodRays()
        {
            GameObject raysRoot = new GameObject("Volumetric_GodRays");
            raysRoot.transform.SetParent(transform, false);

            float[] rayZ = { -5.0f, 0.5f, 5.5f };
            foreach (float rz in rayZ)
            {
                GameObject ray = GameObject.CreatePrimitive(PrimitiveType.Quad);
                Destroy(ray.GetComponent<Collider>());
                ray.transform.SetParent(raysRoot.transform, false);
                ray.transform.localPosition = new Vector3(3.5f, 5.2f, rz);
                ray.transform.localRotation = Quaternion.Euler(12f, -15f, 56f);
                ray.transform.localScale = new Vector3(3.4f, 18.0f, 1.0f);
                Renderer r = ray.GetComponent<Renderer>();
                r.sharedMaterial = _matGodRay;
                r.shadowCastingMode = ShadowCastingMode.Off;
            }
        }

        private GameObject CreateBox(Transform parent, string name, Vector3 pos, Vector3 scale, Material mat)
        {
            GameObject box = GameObject.CreatePrimitive(PrimitiveType.Cube);
            box.name = name;
            box.transform.SetParent(parent, false);
            box.transform.localPosition = pos;
            box.transform.localScale = scale;
            box.GetComponent<Renderer>().sharedMaterial = mat;
            return box;
        }
    }
}
