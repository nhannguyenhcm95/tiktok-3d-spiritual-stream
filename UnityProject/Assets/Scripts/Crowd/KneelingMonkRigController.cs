using UnityEngine;

namespace ChanhDien.Crowd
{
    public class KneelingMonkRigController : MonoBehaviour
    {
        [Header("Rig Transforms")]
        public Transform spinePivot;
        public Transform headPivot;
        public Transform leftArmPivot;
        public Transform rightArmPivot;

        public void SetBowProgress(float bendProgress)
        {
            float spineAngle = Mathf.Lerp(5f, 68f, bendProgress);
            float headAngle = Mathf.Lerp(8f, 45f, bendProgress);

            if (spinePivot != null)
            {
                spinePivot.localRotation = Quaternion.Euler(spineAngle, 0f, 0f);
            }
            if (headPivot != null)
            {
                headPivot.localRotation = Quaternion.Euler(headAngle, 0f, 0f);
            }
        }
    }
}
