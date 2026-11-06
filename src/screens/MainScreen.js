import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import ProfileView from './ProfileView';
import PeopleScreen from './PeopleScreen';
import PostDetailScreen from './PostDetailScreen';
import CreatePostScreen from './CreatePostScreen';
import FeedScreen from './FeedScreen';
import SearchScreen from './SearchScreen';
import OfflineBanner from '../components/OfflineBanner';
import NotificationsScreen from './NotificationsScreen';
import { useAction, useLiveData } from '../hooks/useLiveData';
import { useLocalNotifications } from '../hooks/useLocalNotifications';
import { markNotificationRead, notificationTarget, observeNotifications, observeUnread } from '../services/notificationService';

const tabs = [
  { id: 'home', label: 'Inicio', icon: 'home-outline', selected: 'home' },
  { id: 'explore', label: 'Explorar', icon: 'compass-outline', selected: 'compass' },
  { id: 'search', label: 'Buscar', icon: 'search-outline', selected: 'search' },
  { id: 'profile', label: 'Mi perfil', icon: 'person-outline', selected: 'person' },
];
export default function MainScreen() {
  const { user } = useAuth();
  const inset = useSafeAreaInsets();
  const [tab, setTab] = useState('home');
  const [stack, setStack] = useState([]);
  const [blocked, setBlocked] = useState(false);
  const [feedVersion, setFeedVersion] = useState(0);
  const [pendingNotice, setPendingNotice] = useState(null);
  const [editingProtected, setEditingProtected] = useState(false);
  const notices = useLiveData(useCallback((next, fail) => observeNotifications(user.uid, next, fail), [user.uid]));
  const unread = useLiveData(useCallback((next, fail) => observeUnread(user.uid, next, fail), [user.uid]));
  const noticeAction = useAction();
  const local = useLocalNotifications(user.uid, notices.data, setPendingNotice);
  const exitGuard = useRef(null);
  useEffect(() => {
    if (!pendingNotice || blocked || editingProtected || noticeAction.busy) return;
    const { noticeId, ...target } = pendingNotice;
    setPendingNotice(null);
    setStack((value) => [...value, target]);
    if (noticeId) markNotificationRead(noticeId).catch(() => {});
  }, [pendingNotice, blocked, editingProtected, noticeAction.busy]);
  const onEditing = useCallback((handler) => { exitGuard.current = handler; setEditingProtected(!!handler); }, []);
  const pop = useCallback(() => setStack((value) => value.slice(0, -1)), []);
  const back = useCallback(() => {
    if (blocked || noticeAction.busy) return;
    if (exitGuard.current) { exitGuard.current(); return; }
    if (stack.length) pop();
    else if (tab !== 'home') setTab('home');
  }, [blocked, noticeAction.busy, stack.length, tab, pop]);
  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (blocked || noticeAction.busy || exitGuard.current || stack.length || tab !== 'home') { back(); return true; }
      return false;
    });
    return () => listener.remove();
  }, [back, blocked, noticeAction.busy, stack.length, tab]);
  function push(route) { if (!blocked) setStack((value) => [...value, route]); }
  const onUser = (id) => push({ type: 'profile', id });
  const onPost = (id) => push({ type: 'post', id });
  const onPeople = (id, listType) => push({ type: 'people', id, listType });
  const onCreate = () => push({ type: 'create' });
  const onNotifications = () => push({ type: 'notifications' });
  async function openNotice(item) {
    const target = notificationTarget(item);
    if (!target) return;
    if (await noticeAction.run(() => markNotificationRead(item.id))) push(target);
  }
  const route = stack.at(-1);
  let detail;
  const key = stack.length + ':' + route?.type + ':' + route?.id;
  if (route?.type === 'people') detail = <PeopleScreen key={key} id={route.id} type={route.listType} onBack={pop} onUser={onUser} />;
  if (route?.type === 'profile') detail = <ProfileView key={key} uid={route.id} onBack={pop} onPost={onPost} onPeople={onPeople} onBusy={setBlocked} />;
  if (route?.type === 'post') detail = <PostDetailScreen key={key} id={route.id} onBack={pop} onUser={onUser} onPeople={onPeople} onBusy={setBlocked} onEditing={onEditing} />;
  if (route?.type === 'notifications') detail = <NotificationsScreen key={key} state={notices} unreadState={unread} local={local} onBack={pop} onOpen={openNotice} action={noticeAction} />;
  if (route?.type === 'create') detail = <CreatePostScreen key={key} onBack={pop} onBusy={setBlocked} onEditing={onEditing}
    onPublished={() => { setBlocked(false); setStack([]); setTab('home'); setFeedVersion((n) => n + 1); }} />;
  return <View style={{ flex: 1, backgroundColor: '#FFF8F4' }}>
    <OfflineBanner />
    <View style={{ flex: 1, display: route ? 'none' : 'flex' }}>
      {tab === 'profile' ? <ProfileView uid={user.uid} onPost={onPost} onPeople={onPeople} onBusy={setBlocked} />
        : tab === 'search' ? <SearchScreen key={user.uid} onUser={onUser} />
        : <FeedScreen key={tab + ':' + feedVersion} explore={tab === 'explore'} onCreate={onCreate} onPost={onPost} onUser={onUser} onPeople={onPeople} onExplore={() => setTab('explore')}
          onNotifications={onNotifications} hasUnread={unread.data === true} unreadError={unread.status === 'error'} />}
    </View>
    {route ? detail : <View style={{ flexDirection: 'row', paddingBottom: inset.bottom, borderTopWidth: 1, borderTopColor: '#E9DED7', backgroundColor: '#FFF8F4' }}>
      {tabs.map((item) => <Pressable key={item.id} disabled={blocked} accessibilityRole="tab" accessibilityState={{ selected: tab === item.id, disabled: blocked }}
        onPress={() => setTab(item.id)} style={{ flex: 1, minHeight: 62, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <Ionicons name={tab === item.id ? item.selected : item.icon} size={23} color={tab === item.id ? '#B63B17' : '#655B55'} />
        <Text style={{ color: tab === item.id ? '#A23718' : '#655B55', fontSize: 12, fontWeight: tab === item.id ? '700' : '400' }}>{item.label}</Text>
      </Pressable>)}
    </View>}
  </View>;
}
