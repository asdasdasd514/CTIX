import React from 'react';
import { NavLink } from 'react-router-dom';
import { useIncidentStore } from '../../store/useIncidentStore';
import { NAV_GROUPS, BOTTOM_NAV_ITEMS } from './sidebarNavConfig';
import { Shield } from 'lucide-react';

interface SidebarProps {
  onCloseMobile?: () => void;
}

// Icon La Bàn Định Hướng Trắng Sáng với Kim Xoay 360 Độ Liên Tục (Y chang hệ thống IRS)
function AnimatedCompass() {
  return (
    <div
      className="relative flex items-center justify-center shrink-0 ml-auto"
      style={{ width: '24px', height: '24px' }}
      title="Đang kích hoạt"
    >
      {/* Vành la bàn tròn trắng sáng */}
      <svg
        style={{ width: '24px', height: '24px' }}
        viewBox="0 0 28 28"
        fill="none"
        className="drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]"
      >
        <circle cx="14" cy="14" r="11.5" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.9" />
      </svg>

      {/* Kim la bàn xoay liên tục 360 độ */}
      <div
        className="absolute inset-0 flex items-center justify-center animate-compass-spin"
        style={{ transformOrigin: 'center center' }}
      >
        <svg
          style={{ width: '18px', height: '18px' }}
          viewBox="0 0 28 28"
          fill="none"
          className="drop-shadow-[0_0_10px_rgba(255,255,255,0.95)]"
        >
          <polygon points="14,3.5 17.5,14 14,11.5 10.5,14" fill="#ffffff" />
          <polygon points="14,24.5 17.5,14 14,16.5 10.5,14" fill="#cbd5e1" />
          <circle cx="14" cy="14" r="2.8" fill="#ffffff" stroke="#0b132b" strokeWidth="1" />
        </svg>
      </div>
    </div>
  );
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { sidebarCollapsed, toggleSidebar, incidents } = useIncidentStore();

  const isCollapsed = Boolean(sidebarCollapsed && !onCloseMobile);
  const pendingCount = incidents.filter((i) => i.status === 'pending').length;

  return (
    <aside
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-[#0b132b] text-slate-300 h-screen flex flex-col border-r border-slate-800/80 select-none shrink-0 transition-all duration-300 ease-in-out shadow-xl z-30 relative`}
    >
      {/* Brand Header với Logo thu nhỏ / phóng to khi click (Y chang IRS) */}
      {isCollapsed ? (
        <div className="pt-5 pb-4 px-2 flex flex-col items-center justify-center border-b border-slate-800/80">
          <div
            role="button"
            onClick={toggleSidebar}
            className="cursor-pointer hover:scale-105 transition active:scale-95 w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg"
            title="Bấm vào logo để mở rộng sidebar"
          >
            <Shield className="w-6 h-6 text-white" />
          </div>
        </div>
      ) : (
        <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-slate-800/80">
          <div
            role="button"
            onClick={!onCloseMobile ? toggleSidebar : undefined}
            className={`flex items-center gap-3 min-w-0 select-none ${
              !onCloseMobile ? 'cursor-pointer group' : ''
            }`}
            title={!onCloseMobile ? 'Bấm vào logo để thu gọn sidebar' : undefined}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition">
              <Shield className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex flex-col leading-none">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight text-white leading-tight">
                  SmartCity
                </span>
                <span className="text-[9px] font-black uppercase rounded-md bg-blue-500/20 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 tracking-wider shrink-0">
                  IOC
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium tracking-wide truncate mt-1">
                Phản Ánh Hiện Trường
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Khu Vực Menu Cuộn */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        <nav
          className={`h-full ${
            isCollapsed ? 'px-2 py-3' : 'px-3 py-3'
          } space-y-4 overflow-y-auto overflow-x-hidden`}
        >
          {NAV_GROUPS.map((group, gIdx) => (
            <div key={group.id} className="space-y-1">
              {isCollapsed ? (
                gIdx > 0 && <div className="my-2 border-t border-slate-800/80 mx-2" title={group.title} />
              ) : (
                <div className="px-3.5 pt-1 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {group.title}
                </div>
              )}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const itemBadge = item.id === 'inbox' && pendingCount > 0 ? `${pendingCount} mới` : item.badge;

                  return (
                    <NavLink
                      key={item.id}
                      to={item.path}
                      onClick={onCloseMobile}
                      title={isCollapsed ? `${group.title}: ${item.label}` : undefined}
                      className={({ isActive }) =>
                        `flex items-center ${
                          isCollapsed
                            ? 'justify-center p-2.5 rounded-xl'
                            : 'gap-3 px-3.5 py-2.5 rounded-xl text-xs hover:translate-x-1'
                        } transition-all duration-200 group relative ${
                          isActive
                            ? 'bg-white/[0.09] hover:bg-white/[0.12] border border-white/20 text-white font-bold shadow-lg shadow-black/25'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60 font-medium'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {/* Cột trắng sáng ở trang đã chọn từ sát mép màn hình bên trái (Y chang IRS) */}
                          {isActive && (
                            <span
                              className={`absolute ${
                                isCollapsed ? '-left-2' : '-left-3'
                              } inset-y-0 w-1.5 bg-white rounded-r-md shadow-[0_0_14px_rgba(255,255,255,0.95),0_0_24px_rgba(255,255,255,0.4)] z-30 transition-all duration-300`}
                            />
                          )}

                          <Icon
                            className={`w-4.5 h-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                              isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                            }`}
                          />

                          {!isCollapsed && (
                            <>
                              <span className="flex-1 text-[13px] truncate font-medium">
                                {item.label}
                              </span>

                              {itemBadge ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold shrink-0">
                                  {itemBadge}
                                </span>
                              ) : isActive ? (
                                <AnimatedCompass />
                              ) : null}
                            </>
                          )}

                          {isCollapsed && itemBadge && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-[#0b132b]" />
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Khu Vực Nút Đáy Dưới Cùng (Bottom Section) */}
      <div
        className={`p-3 border-t border-slate-800/80 space-y-1.5 shrink-0 relative ${
          isCollapsed ? 'flex flex-col items-center' : ''
        }`}
      >
        {BOTTOM_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              onClick={onCloseMobile}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center ${
                  isCollapsed
                    ? 'justify-center p-2.5 rounded-xl w-full'
                    : 'gap-3 px-3.5 py-2.5 rounded-xl text-xs hover:translate-x-1'
                } transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-white/[0.09] hover:bg-white/[0.12] border border-white/20 text-white font-bold shadow-lg shadow-black/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      className={`absolute ${
                        isCollapsed ? '-left-2' : '-left-3'
                      } inset-y-0 w-1.5 bg-white rounded-r-md shadow-[0_0_14px_rgba(255,255,255,0.95)] z-30 transition-all duration-300`}
                    />
                  )}

                  <Icon
                    className={`w-4.5 h-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-[13px] truncate font-medium">{item.label}</span>
                      {isActive && <AnimatedCompass />}
                    </>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;
