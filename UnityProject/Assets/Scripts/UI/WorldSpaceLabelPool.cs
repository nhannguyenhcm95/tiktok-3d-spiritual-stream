using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace ChanhDien.UI
{
    public class WorldSpaceLabelPool : MonoBehaviour
    {
        public static WorldSpaceLabelPool Instance { get; private set; }

        [Header("Prefab & Canvas")]
        public Canvas worldSpaceCanvas;
        public GameObject chatBubblePrefab;
        public int poolSize = 30;

        private readonly Queue<GameObject> _bubblePool = new Queue<GameObject>();

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);

            InitializePool();
        }

        private void InitializePool()
        {
            if (chatBubblePrefab == null || worldSpaceCanvas == null) return;

            for (int i = 0; i < poolSize; i++)
            {
                GameObject obj = Instantiate(chatBubblePrefab, worldSpaceCanvas.transform);
                obj.SetActive(false);
                _bubblePool.Enqueue(obj);
            }
        }

        public void SpawnChatBubble(string comment, Transform anchor)
        {
            if (_bubblePool.Count == 0) return;

            GameObject bubble = _bubblePool.Dequeue();
            bubble.SetActive(true);

            Text txt = bubble.GetComponentInChildren<Text>();
            if (txt != null) txt.text = comment;

            if (anchor != null)
            {
                bubble.transform.position = anchor.position + Vector3.up * 0.4f;
            }

            StartCoroutine(RecycleBubbleRoutine(bubble, 4.5f));
        }

        private System.Collections.IEnumerator RecycleBubbleRoutine(GameObject bubble, float delay)
        {
            yield return new WaitForSeconds(delay);
            bubble.SetActive(false);
            _bubblePool.Enqueue(bubble);
        }
    }
}

