using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;
using UnityEngine.UI;
using ChanhDien.Core;
using ChanhDien.Crowd;

namespace ChanhDien.UI
{
    public class TikTokOverlayHudManager : MonoBehaviour
    {
        public static TikTokOverlayHudManager Instance { get; private set; }

        [Header("Tấm Lòng Thành Panel")]
        public Text fifthSeatInfoText;
        public List<Text> chaserTexts = new List<Text>();
        public Text bowCounterText;

        [Header("Top Banner Toast")]
        public GameObject topBannerPanel;
        public Text topBannerText;

        [Header("TTS Audio Source")]
        public AudioSource ttsAudioSource;
        public string ttsApiBaseUrl = "http://localhost:8080/api/tts";

        private Coroutine _bannerCoroutine;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        private void Start()
        {
            if (CrowdProstrationManager.Instance != null)
            {
                CrowdProstrationManager.Instance.OnBowCycleIncremented += HandleBowCycleIncremented;
            }
        }

        private void HandleBowCycleIncremented(int count)
        {
            if (bowCounterText != null)
            {
                bowCounterText.text = $"Vòng lạy: {count}";
            }
        }

        public void UpdateLeaderboard(CrowdSyncPayload payload)
        {
            if (payload == null) return;

            if (fifthSeatInfoText != null)
            {
                fifthSeatInfoText.text = $"Đệm cuối (hạng 5) có {payload.fifthSeatCoins} xu 🪙";
            }

            if (chaserTexts != null && payload.chasers != null)
            {
                for (int i = 0; i < chaserTexts.Count; i++)
                {
                    if (i < payload.chasers.Count)
                    {
                        var chaser = payload.chasers[i];
                        chaserTexts[i].text = $"{chaser.rank}. {chaser.nickname} — {chaser.coins} 🪙 (còn {chaser.coinsNeeded} xu để lên đệm)";
                        chaserTexts[i].gameObject.SetActive(true);
                    }
                    else
                    {
                        chaserTexts[i].gameObject.SetActive(false);
                    }
                }
            }
        }

        public void ShowTopBanner(string message)
        {
            if (_bannerCoroutine != null) StopCoroutine(_bannerCoroutine);
            _bannerCoroutine = StartCoroutine(ShowBannerRoutine(message));
        }

        private IEnumerator ShowBannerRoutine(string message)
        {
            if (topBannerPanel != null && topBannerText != null)
            {
                topBannerText.text = message;
                topBannerPanel.SetActive(true);
                yield return new WaitForSeconds(3.8f);
                topBannerPanel.SetActive(false);
            }
        }

        public void PlayTtsAnnouncement(string text)
        {
            if (string.IsNullOrEmpty(text) || ttsAudioSource == null) return;
            StartCoroutine(FetchAndPlayTtsAudio(text));
        }

        private IEnumerator FetchAndPlayTtsAudio(string text)
        {
            string url = $"{ttsApiBaseUrl}?text={UnityWebRequest.EscapeURL(text)}";
            using (UnityWebRequest www = UnityWebRequestMultimedia.GetAudioClip(url, AudioType.MPEG))
            {
                yield return www.SendWebRequest();
                if (www.result == UnityWebRequest.Result.Success)
                {
                    AudioClip clip = DownloadHandlerAudioClip.GetContent(www);
                    ttsAudioSource.clip = clip;
                    ttsAudioSource.Play();
                }
                else
                {
                    Debug.LogWarning($"[TTS] Lỗi tải audio stream: {www.error}");
                }
            }
        }
    }
}
