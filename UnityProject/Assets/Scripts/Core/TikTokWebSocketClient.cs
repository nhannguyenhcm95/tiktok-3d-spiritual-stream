using System;
using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using UnityEngine;
using ChanhDien.Crowd;
using ChanhDien.UI;

namespace ChanhDien.Core
{
    public class TikTokWebSocketClient : MonoBehaviour
    {
        public static TikTokWebSocketClient Instance { get; private set; }

        [Header("Connection Settings")]
        public string serverWsUrl = "ws://localhost:8080";
        public bool autoConnectOnStart = true;

        private ClientWebSocket _webSocket;
        private CancellationTokenSource _cts;
        private readonly ConcurrentQueue<string> _messageQueue = new ConcurrentQueue<string>();

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        private void Start()
        {
            if (autoConnectOnStart)
            {
                ConnectToServer();
            }
        }

        public async void ConnectToServer()
        {
            _cts = new CancellationTokenSource();
            _webSocket = new ClientWebSocket();

            try
            {
                Debug.Log($"[TikTokWS] Đang kết nối tới {serverWsUrl}...");
                await _webSocket.ConnectAsync(new Uri(serverWsUrl), _cts.Token);
                Debug.Log("[TikTokWS] Đã kết nối thành công tới WebSocket Server!");
                _ = ReceiveLoop();
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[TikTokWS] Lỗi kết nối WebSocket: {ex.Message}");
            }
        }

        private async Task ReceiveLoop()
        {
            byte[] buffer = new byte[8192];
            while (_webSocket != null && _webSocket.State == WebSocketState.Open && !_cts.IsCancellationRequested)
            {
                try
                {
                    WebSocketReceiveResult result = await _webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), _cts.Token);
                    if (result.MessageType == WebSocketMessageType.Close)
                    {
                        await _webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closing", CancellationToken.None);
                        break;
                    }

                    string message = Encoding.UTF8.GetString(buffer, 0, result.Count);
                    _messageQueue.Enqueue(message);
                }
                catch (Exception ex)
                {
                    Debug.LogWarning($"[TikTokWS] Lỗi nhận tin nhắn: {ex.Message}");
                    break;
                }
            }
        }

        private void Update()
        {
            // Xử lý hàng đợi tin nhắn trên Main Thread của Unity
            while (_messageQueue.TryDequeue(out string rawJson))
            {
                ProcessMessage(rawJson);
            }

            // Phím tắt Debug để kiểm thử nhanh
            HandleDebugHotkeys();
        }

        private void ProcessMessage(string rawJson)
        {
            try
            {
                // Parse dạng Envelope
                if (rawJson.Contains("\"type\":\"crowd_sync\""))
                {
                    // Trích xuất payload data
                    int dataIdx = rawJson.IndexOf("\"data\":");
                    if (dataIdx > 0)
                    {
                        string dataJson = rawJson.Substring(dataIdx + 7).TrimEnd('}');
                        CrowdSyncPayload payload = JsonUtility.FromJson<CrowdSyncPayload>(dataJson);
                        TikTokOverlayHudManager.Instance?.UpdateLeaderboard(payload);
                    }
                }
                else if (rawJson.Contains("\"type\":\"chat_bubble\""))
                {
                    int dataIdx = rawJson.IndexOf("\"data\":");
                    if (dataIdx > 0)
                    {
                        string dataJson = rawJson.Substring(dataIdx + 7).TrimEnd('}');
                        ChatBubblePayload payload = JsonUtility.FromJson<ChatBubblePayload>(dataJson);
                        Transform anchor = CrowdProstrationManager.Instance?.GetDiscipleHeadAnchor(payload.slotIndex, payload.isVip);
                        WorldSpaceLabelPool.Instance?.SpawnChatBubble(payload.comment, anchor);
                    }
                }
                else if (rawJson.Contains("\"type\":\"spotlight_incense\""))
                {
                    int dataIdx = rawJson.IndexOf("\"data\":");
                    if (dataIdx > 0)
                    {
                        string dataJson = rawJson.Substring(dataIdx + 7).TrimEnd('}');
                        SpotlightIncensePayload payload = JsonUtility.FromJson<SpotlightIncensePayload>(dataJson);
                        CrowdProstrationManager.Instance?.TriggerSpotlightIncense(payload);
                        TikTokOverlayHudManager.Instance?.PlayTtsAnnouncement(payload.ttsText);
                    }
                }
                else if (rawJson.Contains("\"type\":\"top_banner\""))
                {
                    int dataIdx = rawJson.IndexOf("\"data\":");
                    if (dataIdx > 0)
                    {
                        string dataJson = rawJson.Substring(dataIdx + 7).TrimEnd('}');
                        TopBannerPayload payload = JsonUtility.FromJson<TopBannerPayload>(dataJson);
                        TikTokOverlayHudManager.Instance?.ShowTopBanner(payload.text);
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[TikTokWS] Lỗi parse JSON: {ex.Message}");
            }
        }

        private void HandleDebugHotkeys()
        {
            if (Input.GetKeyDown(KeyCode.Alpha1))
            {
                WorldSpaceLabelPool.Instance?.SpawnChatBubble("cầu thi tốt 🍀", null);
            }
            if (Input.GetKeyDown(KeyCode.Alpha2))
            {
                TikTokOverlayHudManager.Instance?.ShowTopBanner("Thí chủ đã chia sẻ buổi lễ 🙏");
            }
            if (Input.GetKeyDown(KeyCode.Alpha3))
            {
                SpotlightIncensePayload p = new SpotlightIncensePayload
                {
                    nickname = "Dâu Việt nhà Trung",
                    giftName = "Rosa 🌹",
                    ttsText = "Dâu Việt nhà Trung đã dâng hương, chúc bạn tiền vào như nước."
                };
                CrowdProstrationManager.Instance?.TriggerSpotlightIncense(p);
                TikTokOverlayHudManager.Instance?.PlayTtsAnnouncement(p.ttsText);
            }
        }

        private void OnDestroy()
        {
            _cts?.Cancel();
            _webSocket?.Dispose();
        }
    }
}

