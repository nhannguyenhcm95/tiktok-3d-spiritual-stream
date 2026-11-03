using UnityEngine;

namespace ChanhDien.Graphics
{
    public class ProceduralMandalaGenerator : MonoBehaviour
    {
        public static Texture2D GenerateMandalaTexture(int size = 1024)
        {
            Texture2D tex = new Texture2D(size, size, TextureFormat.RGBA32, true);
            Color baseBronze = new Color(0.62f, 0.48f, 0.26f, 1f); // #9E7B42
            Color highlightBronze = new Color(0.77f, 0.61f, 0.37f, 1f); // #C59B5F

            Vector2 center = new Vector2(size / 2f, size / 2f);
            float maxR = size * 0.48f;

            for (int y = 0; y < size; y++)
            {
                for (int x = 0; x < size; x++)
                {
                    float dist = Vector2.Distance(new Vector2(x, y), center);
                    if (dist > maxR)
                    {
                        tex.SetPixel(x, y, Color.clear);
                        continue;
                    }

                    // Các vòng tròn đồng tâm
                    float ringPattern = Mathf.Sin(dist * 0.15f);
                    float angle = Mathf.Atan2(y - center.y, x - center.x);
                    float petalPattern = Mathf.Cos(angle * 16f) * 0.5f + 0.5f;

                    float mix = Mathf.Clamp01((ringPattern * 0.6f + petalPattern * 0.4f) * 0.5f + 0.5f);
                    Color pixelColor = Color.Lerp(baseBronze, highlightBronze, mix);
                    tex.SetPixel(x, y, pixelColor);
                }
            }

            tex.Apply();
            return tex;
        }
    }
}

