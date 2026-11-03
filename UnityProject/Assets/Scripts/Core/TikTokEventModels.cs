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

    [Serializable]
    public class ServerMessageEnvelope
    {
        public string type;
        public string data; // Raw json string hoặc deserialize cụ thể
    }
}
