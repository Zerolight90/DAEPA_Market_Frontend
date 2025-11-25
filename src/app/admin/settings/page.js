"use client";

import { useState } from "react";
import { Save, RefreshCw, Shield, Bell, Globe, Database, Key, Users } from "lucide-react";
import styles from "../admin.module.css";
import api from "@/lib/api"; // axios 인스턴스 가져오기

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    general: {
      siteName: "대파마켓",
      siteDescription: "믿을 수 있는 중고거래 플랫폼",
      maintenanceMode: false,
      allowRegistration: true,
      requireEmailVerification: true
    },
    security: {
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      requireTwoFactor: false,
      passwordMinLength: 8,
      enableAuditLog: true
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      adminAlerts: true,
      userAlerts: true
    },
    features: {
      enableChat: true,
      enableReviews: true,
      enableWishlist: true,
      enableRecommendations: true,
      enableAnalytics: true
    }
  });

  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 실제 API 호출: PUT 요청으로 전체 설정을 업데이트한다고 가정
      await api.put("/admin/settings", settings);
      alert("설정이 저장되었습니다!");
    } catch (error) {
      console.error("설정 저장 실패:", error);
      alert("설정 저장에 실패했습니다: " + (error.response?.data?.message || error.message));
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: "general", name: "일반 설정", icon: Globe },
    { id: "security", name: "보안 설정", icon: Shield },
    { id: "notifications", name: "알림 설정", icon: Bell },
    { id: "features", name: "기능 설정", icon: Database }
  ];

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>시스템 설정</h1>
        <p className={styles.pageSubtitle}>플랫폼 설정을 관리하고 시스템을 구성하세요</p>
      </div>

      <div className={styles.settingsContainer}>
        {/* Settings Tabs */}
        <div className={styles.settingsTabs}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`${styles.settingsTab} ${activeTab === tab.id ? styles.settingsTabActive : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={20} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Settings Content */}
        <div className={styles.settingsContent}>
          {/* General Settings */}
          {activeTab === "general" && (
            <div className={styles.settingsSection}>
              <h3 className={styles.sectionTitle}>일반 설정</h3>
              <div className={styles.settingsGrid}>
                <div className={styles.settingItem}>
                  <label className={styles.settingLabel}>사이트 이름</label>
                  <input
                    type="text"
                    value={settings.general.siteName}
                    onChange={(e) => updateSetting("general", "siteName", e.target.value)}
                    className={styles.settingInput}
                  />
                </div>
                <div className={styles.settingItem}>
                  <label className={styles.settingLabel}>사이트 설명</label>
                  <textarea
                    value={settings.general.siteDescription}
                    onChange={(e) => updateSetting("general", "siteDescription", e.target.value)}
                    className={styles.settingTextarea}
                    rows={3}
                  />
                </div>
                <div className={styles.settingItem}>
                  <label className={styles.settingLabel}>
                    <input
                      type="checkbox"
                      checked={settings.general.maintenanceMode}
                      onChange={(e) => updateSetting("general", "maintenanceMode", e.target.checked)}
                      className={styles.settingCheckbox}
                    />
                    유지보수 모드
                  </label>
                </div>
                <div className={styles.settingItem}>
                  <label className={styles.settingLabel}>
                    <input
                      type="checkbox"
                      checked={settings.general.allowRegistration}
                      onChange={(e) => updateSetting("general", "allowRegistration", e.target.checked)}
                      className={styles.settingCheckbox}
                    />
                    회원가입 허용
                  </label>
                </div>
                <div className={styles.settingItem}>
                  <label className={styles.settingLabel}>
                    <input
                      type="checkbox"
                      checked={settings.general.requireEmailVerification}
                      onChange={(e) => updateSetting("general", "requireEmailVerification", e.target.checked)}
                      className={styles.settingCheckbox}
                    />
                    이메일 인증 필수
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === "security" && (
            <div className={styles.settingsSection}>
              <h3 className={styles.sectionTitle}>보안 설정</h3>
              <div className={styles.settingsGrid}>
                <div className={styles.settingItem}>
                  <label className={styles.settingLabel}>세션 타임아웃 (분)</label>
                  <input
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => updateSetting("security", "sessionTimeout", parseInt(e.target.value))}
                    className={styles.settingInput}
                    min="5"
                    max="120"
                  />
                </div>
                <div className={styles.settingItem}>
                  <label className={styles.settingLabel}>최대 로그인 시도 횟수</label>
                  <input
                    type="number"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => updateSetting("security", "maxLoginAttempts", parseInt(e.target.value))}
                    className={styles.settingInput}
                    min="3"
                    max="10"
                  />
                </div>
                <div className={styles.settingItem}>
                  <label className={styles.settingLabel}>최소 비밀번호 길이</label>
                  <input
                    type="number"
                    value={settings.security.passwordMinLength}
                    onChange={(e) => updateSetting("security", "passwordMinLength", parseInt(e.target.value))}
                    className={styles.settingInput}
                    min="6"
                    max="20"
                  />
                </div>
                <div className={styles.settingItem}>
                  <label className={styles.settingLabel}>
                    <input
                      type="checkbox"
                      checked={settings.security.requireTwoFactor}
                      onChange={(e) => updateSetting("security", "requireTwoFactor", e.target.checked)}
                      className={styles.settingCheckbox}
                    />
                    2단계 인증 필수
                  </label>
                </div>
                <div className={styles.settingItem}>
                  <label className={styles.settingLabel}>
                    <input
                      type="checkbox"
                      checked={settings.security.enableAuditLog}
                      onChange={(e) => updateSetting("security", "enableAuditLog", e.target.checked)}
                      className={styles.settingCheckbox}
                    />
                    감사 로그 활성화
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === "notifications" && (
            <div className={styles.settingsSection}>
              <h3 className={styles.sectionTitle}>알림 설정</h3>
              <div className={styles.settingsGrid}>
                <div className={styles.settingItem}>
                  <label className={styles.settingLabel}>
                    <input
                      type="checkbox"
                      checked={settings.notifications.emailNotifications}
                      onChange={(e) => updateSetting("notifications", "emailNotifications", e.target.checked)}
                      className={styles.settingCheckbox}
                    />
                    이메일 알림
                  </label>
                </div>
                <div className={styles.settingItem}>
                  <label className={styles.settingLabel}>
                    <input
                      type="checkbox"
                      checked={settings.notifications.smsNotifications}
                      onChange={(e) => updateSetting("notifications", "smsNotifications", e.target.checked)}
                      className={styles.settingCheckbox}
                    />
                    SMS 알림
                  </label>
                </div>
                <div className={styles.settingItem}>
                  <label className={styles.settingLabel}>
                    <input
                      type="checkbox"
                      checked={settings.notifications.pushNotifications}
                      onChange={(e) => updateSetting("notifications", "pushNotifications", e.target.checked)}
                      className={styles.settingCheckbox}
                    />
                    푸시 알림
                  </label>
                </div>
                <div className={styles.settingItem}>
                  <label className={styles.settingLabel}>
                    <input
                      type="checkbox"
                      checked={settings.notifications.adminAlerts}
                      onChange={(e) => updateSetting("notifications", "adminAlerts", e.target.checked)}
                      className={styles.settingCheckbox}
                    />
                    관리자 알림
                  </label>
                </div>
                <div className={styles.settingItem}>
                  <label className={styles.settingLabel}>
                    <input
                      type="checkbox"
                      checked={settings.notifications.userAlerts}
                      onChange={(e) => updateSetting("notifications", "userAlerts", e.target.checked)}
                      className={styles.settingCheckbox}
                    />
                    사용자 알림
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Feature Settings */}
          {activeTab === "features" && (
            <div className={styles.settingsSection}>
              <h3 className={styles.sectionTitle}>기능 설정</h3>
              <div className={styles.settingsGrid}>
                <div className={styles.settingItem}>
                  <label className={styles.settingLabel}>
                    <input
                      type="checkbox"
                      checked={settings.features.enableChat}
                      onChange={(e) => updateSetting("features", "enableChat", e.target.checked)}
                      className={styles.settingCheckbox}
                    />
                    채팅 기능
                  </label>
                </div>
                <div className={styles.settingItem}>
                  <label className={styles.settingLabel}>
                    <input
                      type="checkbox"
                      checked={settings.features.enableReviews}
                      onChange={(e) => updateSetting("features", "enableReviews", e.target.checked)}
                      className={styles.settingCheckbox}
                    />
                    리뷰 기능
                  </label>
                </div>
                <div className={styles.settingItem}>
                  <label className={styles.settingLabel}>
                    <input
                      type="checkbox"
                      checked={settings.features.enableWishlist}
                      onChange={(e) => updateSetting("features", "enableWishlist", e.target.checked)}
                      className={styles.settingCheckbox}
                    />
                    위시리스트 기능
                  </label>
                </div>
                <div className={styles.settingItem}>
                  <label className={styles.settingLabel}>
                    <input
                      type="checkbox"
                      checked={settings.features.enableRecommendations}
                      onChange={(e) => updateSetting("features", "enableRecommendations", e.target.checked)}
                      className={styles.settingCheckbox}
                    />
                    추천 기능
                  </label>
                </div>
                <div className={styles.settingItem}>
                  <label className={styles.settingLabel}>
                    <input
                      type="checkbox"
                      checked={settings.features.enableAnalytics}
                      onChange={(e) => updateSetting("features", "enableAnalytics", e.target.checked)}
                      className={styles.settingCheckbox}
                    />
                    분석 기능
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className={styles.settingsActions}>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={styles.saveButton}
            >
              {isSaving ? (
                <>
                  <RefreshCw size={16} className={styles.spinning} />
                  저장 중...
                </>
              ) : (
                <>
                  <Save size={16} />
                  설정 저장
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
