import { useEffect, useState } from "react";
import {
  Link2,
  Unlink,
  UserRound,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import {
  hrGet,
  hrPut,
} from "../../pages/hr-v2/hrApi";

export default function EmployeeUserLink({
  employee,
  onChanged,
}) {
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState(
    employee?.user_id || ""
  );

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setUserId(employee?.user_id || "");
  }, [employee?.user_id]);

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      try {
        setLoading(true);
        setError("");

        const response = await hrGet(
          "/hr/users-for-linking"
        );

        if (!active) return;

        setUsers(response?.data || []);
      } catch (e) {
        if (!active) return;

        setError(
          e.message ||
            "تعذر تحميل حسابات المستخدمين."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      active = false;
    };
  }, []);

  async function saveLink() {
    if (!employee?.id) {
      setError("بيانات الموظف غير مكتملة.");
      return;
    }

    try {
      setBusy(true);
      setError("");
      setMessage("");

      const response = await hrPut(
        `/hr/employees/${employee.id}/user-link`,
        {
          user_id: userId
            ? Number(userId)
            : null,
        }
      );

      setMessage(
        response?.message ||
          "تم تحديث حساب المستخدم."
      );

      if (response?.data) {
        setUserId(
          response.data.user_id || ""
        );

        onChanged?.(response.data);
      }
    } catch (e) {
      setError(
        e.message ||
          "تعذر حفظ ربط حساب المستخدم."
      );
    } finally {
      setBusy(false);
    }
  }

  const selectedUser = users.find(
    (user) =>
      String(user.id) === String(userId)
  );

  return (
    <div
      dir="rtl"
      style={{
        border: "1px solid #e6e7f0",
        borderRadius: 16,
        padding: 18,
        background: "#fafafe",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 18,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            background: "#f0efff",
            color: "#6657F5",
            display: "grid",
            placeItems: "center",
          }}
        >
          <UserRound size={20} />
        </div>

        <div>
          <strong
            style={{
              display: "block",
              fontSize: 15,
            }}
          >
            حساب الدخول للنظام
          </strong>

          <span
            style={{
              fontSize: 12,
              color: "#7b8399",
            }}
          >
            هذا الحساب فقط يستطيع تسجيل حضور
            هذا الموظف في المشاريع.
          </span>
        </div>
      </div>

      {/* FORM */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(260px, 1fr) auto",
          gap: 10,
          alignItems: "end",
        }}
      >
        <label
          style={{
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          حساب المستخدم

          <select
            value={userId}
            disabled={loading || busy}
            onChange={(e) => {
              setUserId(e.target.value);
              setMessage("");
              setError("");
            }}
            style={{
              display: "block",
              width: "100%",
              marginTop: 7,
              minHeight: 43,
              padding: "0 12px",
              border:
                "1px solid #dfe1eb",
              borderRadius: 10,
              background: "#fff",
              color: "#1f2340",
              outline: "none",
            }}
          >
            <option value="">
              {loading
                ? "جاري تحميل الحسابات..."
                : "غير مرتبط بحساب"}
            </option>

            {users.map((user) => (
              <option
                key={user.id}
                value={user.id}
              >
                {user.name}
                {user.email
                  ? ` — ${user.email}`
                  : ""}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={saveLink}
          disabled={busy || loading}
          style={{
            minHeight: 43,
            border: 0,
            borderRadius: 10,
            padding: "0 18px",
            background: "#6657F5",
            color: "#fff",
            fontWeight: 800,
            cursor:
              busy || loading
                ? "not-allowed"
                : "pointer",
            opacity:
              busy || loading ? 0.6 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            whiteSpace: "nowrap",
          }}
        >
          {userId ? (
            <Link2 size={16} />
          ) : (
            <Unlink size={16} />
          )}

          {busy
            ? "جاري الحفظ..."
            : userId
            ? "حفظ الربط"
            : "إلغاء الربط"}
        </button>
      </div>

      {/* CURRENT LINK */}

      {selectedUser && (
        <div
          style={{
            marginTop: 14,
            padding: "11px 13px",
            borderRadius: 10,
            background: "#f0fdf4",
            color: "#166534",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
          }}
        >
          <CheckCircle2 size={17} />

          <div>
            الحساب المحدد:{" "}
            <strong>
              {selectedUser.name}
            </strong>

            {selectedUser.email && (
              <span>
                {" "}
                — {selectedUser.email}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ERROR */}

      {error && (
        <div
          style={{
            marginTop: 12,
            padding: "10px 12px",
            borderRadius: 10,
            background: "#fff1f2",
            color: "#be123c",
            display: "flex",
            alignItems: "center",
            gap: 7,
            fontSize: 13,
          }}
        >
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* SUCCESS */}

      {message && (
        <div
          style={{
            marginTop: 12,
            padding: "10px 12px",
            borderRadius: 10,
            background: "#ecfdf5",
            color: "#047857",
            display: "flex",
            alignItems: "center",
            gap: 7,
            fontSize: 13,
          }}
        >
          <CheckCircle2 size={16} />
          {message}
        </div>
      )}
    </div>
  );
}