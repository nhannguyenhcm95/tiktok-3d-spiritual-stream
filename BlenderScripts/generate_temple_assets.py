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
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=16,
        radius=1.35 * scale_factor,
        depth=0.45 * scale_factor,
        location=(location[0], location[1], location[2] + 0.22 * scale_factor)
    )
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
            bpy.ops.mesh.primitive_uv_sphere_add(
                segments=12,
                ring_count=8,
                radius=0.26 * scale_factor,
                location=(px, py, ring_z)
            )
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
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.82 * scale_factor,
        minor_radius=0.24 * scale_factor,
        location=(location[0], location[1], base_z + 0.2 * scale_factor)
    )
    legs = bpy.context.active_object
    legs.scale = (1.15, 0.75, 0.65)
    legs.data.materials.append(mat_bronze)
    objs.append(legs)

    # Thân tượng Phật (Pewter Stone)
    bpy.ops.mesh.primitive_cone_add(
        vertices=24,
        radius1=0.72 * scale_factor,
        radius2=0.52 * scale_factor,
        depth=1.55 * scale_factor,
        location=(location[0], location[1], base_z + 1.05 * scale_factor)
    )
    torso = bpy.context.active_object
    torso.scale = (1.05, 0.68, 1.0)
    torso.data.materials.append(mat_pewter)
    objs.append(torso)

    # Dải y áo Ca-sa đồng cổ vắt chéo vai trái
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=24,
        radius=0.62 * scale_factor,
        depth=1.48 * scale_factor,
        location=(location[0] - 0.06 * scale_factor, location[1] + 0.02 * scale_factor, base_z + 1.02 * scale_factor)
    )
    sash = bpy.context.active_object
    sash.scale = (0.85, 0.72, 1.0)
    sash.rotation_euler = (0.0, 0.22, 0.0)
    sash.data.materials.append(mat_bronze)
    objs.append(sash)

    # Đầu Phật & Nhục kế (Ushnisha)
    head_z = base_z + 2.15 * scale_factor
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=24,
        ring_count=16,
        radius=0.42 * scale_factor,
        location=(location[0], location[1], head_z)
    )
    head = bpy.context.active_object
    head.scale = (0.92, 0.95, 1.08)
    head.data.materials.append(mat_pewter)
    objs.append(head)

    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=16,
        ring_count=12,
        radius=0.18 * scale_factor,
        location=(location[0], location[1], head_z + 0.42 * scale_factor)
    )
    ushnisha = bpy.context.active_object
    ushnisha.data.materials.append(mat_pewter)
    objs.append(ushnisha)

    # Phù điêu Hào quang Mandala khổng lồ phía sau Đại Phật
    if with_mandala:
        bpy.ops.mesh.primitive_cylinder_add(
            vertices=64,
            radius=2.15 * scale_factor,
            depth=0.14 * scale_factor,
            location=(location[0], location[1] + 0.55 * scale_factor, base_z + 1.45 * scale_factor)
        )
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
    print("Exported 3D Models to:", OUTPUT_DIR)

if __name__ == "__main__":
    main()
