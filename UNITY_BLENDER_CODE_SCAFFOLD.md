# DÀN CODE KIẾN TRÚC (CODE SCAFFOLDING) UNITY + BLENDER + TIKTOK LIVE CHO ANTIGRAVITY

Tài liệu này cung cấp cây thư mục chuẩn và bộ khung mã nguồn (Code Scaffolding) đầy đủ cho cả **Blender Python (`bpy`)**, **Unity C# (URP)** và **Node.js TikTok Live Server** để Antigravity triển khai không lỗi.

---

## 1. CẤU TRÚC CÂY THƯ MỤC DỰ ÁN (`project-root/`)

```text
project-root/
├── GRAPHICS_ANTIGRAVITY_SPEC.md
├── UNITY_BLENDER_CODE_SCAFFOLD.md
├── BlenderScripts/
│   └── generate_temple_assets.py          # Script Python tự động dựng 5 Tượng Phật, Mandala, Cột đá, Phật tử quỳ (.fbx)
├── TikTokServer/
│   ├── package.json
│   ├── index.js                           # WebSocket Server (ws://localhost:8080) + Google TTS Proxy (/api/tts)
│   ├── tiktokConnector.js                 # Kết nối tiktok-live-connector
│   ├── leaderboardEngine.js               # Tính toán Top 5 Đệm VIP & số xu còn thiếu ở bảng Tấm Lòng Thành
│   └── mockSimulator.js                   # Giả lập 64 Phật tử comment, share, tặng quà liên tục
└── UnityProject/
    └── Assets/
        ├── Models/                        # Nơi chứa file .fbx xuất tự động từ Blender
        ├── Materials/                     # Chứa các Material PBR (Pewter, Bronze, Stone, Slate, Robes)
        ├── Prefabs/                       # Prefab Tượng Phật, Phật tử Quỳ, Bong bóng Chat, Tia nắng GodRay
        └── Scripts/
            ├── Core/
            │   ├── TikTokEventModels.cs           # Các class JSON Model đồng bộ với Node.js Server
            │   └── TikTokWebSocketClient.cs       # Nhận sự kiện Realtime từ ws://localhost:8080 + Phím tắt Debug
            ├── Graphics/
            │   ├── SanctuaryEnvironmentBuilder.cs # Dựng Chánh Điện, Vật liệu PBR, Nắng xiên & Tia nắng God Rays
            │   └── ProceduralMandalaGenerator.cs  # Tạo Normal/Height map chạm nổi cho Phù điêu Mandala & Sàn đá
            ├── Crowd/
            │   ├── KneelingMonkRigController.cs   # Điều khiển khớp xương (Spine, Head, Arms, Feet) của 1 Phật tử
            │   └── CrowdProstrationManager.cs     # Quản lý 64 Phật tử + 5 VIP + Sư Áo Vàng + Spotlight Solo Dâng Hương
            └── UI/
                ├── TikTokOverlayHudManager.cs     # Bảng TẤM LÒNG THÀNH, Banner Chia Sẻ, Bộ đếm Vòng lạy & TTS Audio
                └── WorldSpaceLabelPool.cs         # Object Pooling cho Tên TikTok và Bong bóng Chat trắng trên đầu
```

---

## 2. SCRIPT BLENDER PYTHON TỰ ĐỘNG DỰNG MODEL 3D (`BlenderScripts/generate_temple_assets.py`)

> **Hướng dẫn chạy bằng lệnh cho Antigravity:**
> `blender --background --python BlenderScripts/generate_temple_assets.py`

```python
import bpy
import bmesh
import math
import os

OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../UnityProject/Assets/Models"))
os.makedirs(OUTPUT_DIR, exist_ok=True)

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def create_pbr_material(name, hex_color, metallic=0.0, roughness=0.5):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    hex_val = hex_color.lstrip('#')
    rgb = tuple(int(hex_val[i:i+2], 16) / 255.0 for i in (0, 2, 4))
    bsdf.inputs["Base Color"].default_value = (rgb[0], rgb[1], rgb[2], 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    return mat

def build_lotus_throne(name, location, scale_factor, mat_bronze):
    throne_objs = []
    # Đế bát giác chạm khắc
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=1.35 * scale_factor, depth=0.45 * scale_factor, location=(location[0], location[1], location[2] + 0.22 * scale_factor))
    base = bpy.context.active_object
    base.name = f"{name}_Base"
    base.data.materials.append(mat_bronze)
    throne_objs.append(base)

    # 3 tầng cánh sen bao quanh đài
    for ring in range(3):
        petal_count = 16 if ring < 2 else 12
        ring_radius = (1.15 - ring * 0.12) * scale_factor
        ring_z = location[2] + (0.45 + ring * 0.18) * scale_factor
        for i in range(petal_count):
            angle = (2.0 * math.pi * i / petal_count) + (ring * 0.2)
            px = location[0] + math.cos(angle) * ring_radius
            py = location[1] + math.sin(angle) * ring_radius
            bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=0.26 * scale_factor, location=(px, py, ring_z))
            petal = bpy.context.active_object
            petal.scale = (0.65, 0.35, 1.25)
            petal.rotation_euler = (0.35, 0.0, angle + math.pi / 2.0)
            petal.data.materials.append(mat_bronze)
            throne_objs.append(petal)
    return throne_objs

def build_buddha_statue(name, location, scale_factor, with_mandala, mat_pewter, mat_bronze, mat_mandala):
    objs = build_lotus_throne(name, location, scale_factor, mat_bronze)
    base_z = location[2] + 0.85 * scale_factor

    # Chân xếp bằng kiết già
    bpy.ops.mesh.primitive_torus_add(major_radius=0.82 * scale_factor, minor_radius=0.24 * scale_factor, location=(location[0], location[1], base_z + 0.2 * scale_factor))
    legs = bpy.context.active_object
    legs.scale = (1.15, 0.75, 0.65)
    legs.data.materials.append(mat_bronze)
    objs.append(legs)

    # Thân tượng Phật (Pewter Stone)
    bpy.ops.mesh.primitive_cone_add(vertices=24, radius1=0.72 * scale_factor, radius2=0.52 * scale_factor, depth=1.55 * scale_factor, location=(location[0], location[1], base_z + 1.05 * scale_factor))
    torso = bpy.context.active_object
    torso.scale = (1.05, 0.68, 1.0)
    torso.data.materials.append(mat_pewter)
    objs.append(torso)

    # Dải y áo Ca-sa đồng cổ vắt chéo vai trái
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.62 * scale_factor, depth=1.48 * scale_factor, location=(location[0] - 0.06 * scale_factor, location[1] + 0.02 * scale_factor, base_z + 1.02 * scale_factor))
    sash = bpy.context.active_object
    sash.scale = (0.85, 0.72, 1.0)
    sash.rotation_euler = (0.0, 0.22, 0.0)
    sash.data.materials.append(mat_bronze)
    objs.append(sash)

    # Đầu Phật & Nhục kế (Ushnisha)
    head_z = base_z + 2.15 * scale_factor
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, radius=0.42 * scale_factor, location=(location[0], location[1], head_z))
    head = bpy.context.active_object
    head.scale = (0.92, 0.95, 1.08)
    head.data.materials.append(mat_pewter)
    objs.append(head)

    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=12, radius=0.18 * scale_factor, location=(location[0], location[1], head_z + 0.42 * scale_factor))
    ushnisha = bpy.context.active_object
    ushnisha.data.materials.append(mat_pewter)
    objs.append(ushnisha)

    # Phù điêu Hào quang Mandala khổng lồ phía sau Đại Phật
    if with_mandala:
        bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=2.15 * scale_factor, depth=0.14 * scale_factor, location=(location[0], location[1] + 0.55 * scale_factor, base_z + 1.45 * scale_factor))
        mandala = bpy.context.active_object
        mandala.rotation_euler = (math.pi / 2.0, 0.0, 0.0)
        mandala.data.materials.append(mat_mandala)
        objs.append(mandala)

    # Gộp thành 1 Mesh hoàn chỉnh
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    objs[0].name = name
    return objs[0]

def build_kneeling_monk_prefab(name, mat_skin, mat_robe):
    parts = []
    # Phần chân quỳ & 2 bàn chân dựng phía sau
    bpy.ops.mesh.primitive_cube_add(size=0.42, location=(0.0, 0.05, 0.16))
    knees = bpy.context.active_object
    knees.scale = (0.95, 1.25, 0.65)
    knees.data.materials.append(mat_robe)
    parts.append(knees)

    for side in (-1, 1):
        bpy.ops.mesh.primitive_cube_add(size=0.14, location=(side * 0.11, -0.26, 0.14))
        foot = bpy.context.active_object
        foot.scale = (0.65, 0.45, 1.35)
        foot.rotation_euler = (0.25, 0.0, 0.0)
        foot.data.materials.append(mat_skin)
        parts.append(foot)

    # Thân trên mặc áo tràng lệch vai
    bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=0.24, radius2=0.19, depth=0.62, location=(0.0, 0.08, 0.58))
    torso = bpy.context.active_object
    torso.scale = (1.05, 0.72, 1.0)
    torso.data.materials.append(mat_robe)
    parts.append(torso)

    # Đầu tròn & Hai tay chắp trước ngực
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=12, radius=0.135, location=(0.0, 0.09, 1.02))
    head = bpy.context.active_object
    head.scale = (0.92, 0.96, 1.06)
    head.data.materials.append(mat_skin)
    parts.append(head)

    bpy.ops.mesh.primitive_cube_add(size=0.16, location=(0.0, 0.24, 0.66))
    hands = bpy.context.active_object
    hands.scale = (0.45, 0.85, 0.95)
    hands.rotation_euler = (0.55, 0.0, 0.0)
    hands.data.materials.append(mat_skin)
    parts.append(hands)

    bpy.ops.object.select_all(action='DESELECT')
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = torso
    bpy.ops.object.join()
    torso.name = name
    return torso

def main():
    clear_scene()
    mat_pewter = create_pbr_material("Mat_BuddhaSkin_Pewter", "#8C9295", metallic=0.60, roughness=0.45)
    mat_bronze = create_pbr_material("Mat_AntiqueBronze", "#C59B5F", metallic=0.85, roughness=0.32)
    mat_mandala = create_pbr_material("Mat_MandalaRelief", "#9E7B42", metallic=0.80, roughness=0.40)
    mat_skin = create_pbr_material("Mat_HumanSkin", "#D8A984", metallic=0.0, roughness=0.65)
    mat_grey_robe = create_pbr_material("Mat_MonkGreyRobe", "#54595E", metallic=0.02, roughness=0.88)

    build_buddha_statue("Great_Center_Buddha", (0.0, 0.0, 0.0), 2.4, True, mat_pewter, mat_bronze, mat_mandala)
    bpy.ops.export_scene.fbx(filepath=os.path.join(OUTPUT_DIR, "FiveBuddha_Center.fbx"), use_selection=True)

    clear_scene()
    build_kneeling_monk_prefab("Kneeling_Disciple", mat_skin, mat_grey_robe)
    bpy.ops.export_scene.fbx(filepath=os.path.join(OUTPUT_DIR, "Kneeling_Disciple.fbx"), use_selection=True)

if __name__ == "__main__":
    main()
```

---

## 3. CÁC FILE C# CỐT LÕI TRONG UNITY (`UnityProject/Assets/Scripts/`)

### 3.1. `Assets/Scripts/Core/TikTokEventModels.cs`
Định nghĩa đầy đủ cấu trúc dữ liệu đồng bộ giữa Node.js Server và Unity:

```csharp
using System;
using System.Collections.Generic;

namespace ChanhDien.Core
{
    [Serializable]
    public class VipSeatData
    {
        public int rank;
        public string uniqueId;
        public string nickname;
        public int coins;
        public string robeType;
    }

    [Serializable]
    public class ChaserData
    {
        public int rank;
        public string nickname;
        public int coins;
        public int coinsNeeded;
    }

    [Serializable]
    public class CrowdMemberData
    {
        public string uniqueId;
        public string nickname;
        public string robeType;
        public int slotIndex;
    }

    [Serializable]
    public class CrowdSyncPayload
    {
        public List<VipSeatData> vipSeats = new List<VipSeatData>();
        public int fifthSeatCoins = 50;
        public List<ChaserData> chasers = new List<ChaserData>();
        public List<CrowdMemberData> crowdMembers = new List<CrowdMemberData>();
    }

    [Serializable]
    public class ChatBubblePayload
    {
        public string id;
        public string uniqueId;
        public string nickname;
        public string comment;
        public int slotIndex;
        public bool isVip;
    }

    [Serializable]
    public class SpotlightIncensePayload
    {
        public string id;
        public string uniqueId;
        public string nickname;
        public string giftName;
        public int diamondCount;
        public int repeatCount;
        public string robeType;
        public string ttsText;
    }

    [Serializable]
    public class TopBannerPayload
    {
        public string text;
        public string type;
    }
}
```

---

### 3.2. `Assets/Scripts/Graphics/SanctuaryEnvironmentBuilder.cs`
Dựng cảnh Chánh Điện Ngũ Phương Phật, gán vật liệu PBR chuẩn mã Hex, thiết lập nắng chiếu xiên qua hàng cột bên phải và tạo luồng tia sáng Volumetric God Rays:

```csharp
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
```

---

### 3.3. `Assets/Scripts/Crowd/CrowdProstrationManager.cs`
Quản lý vị Sư Chủ Lễ Áo Vàng ở chính giữa, đội hình 64 Phật tử Áo Xám quỳ lạy 2 bên, 5 Đệm VIP và hiệu ứng **Spotlight Solo Dâng Hương** khi có người tặng quà:

```csharp
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
```