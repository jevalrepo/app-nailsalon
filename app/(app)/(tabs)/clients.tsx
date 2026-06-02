import { useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useClients } from '@/hooks/useClients';
import type { Client } from '@/types';

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

const AVATAR_COLORS = [
  '#F4A99A', '#C4B5FD', '#FDA4AF', '#6EE7B7', '#7DD3FC', '#FDBA74',
  '#A78BFA', '#34D399', '#60A5FA', '#FB923C',
];
function avatarColor(name: string) {
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[Math.abs(hash)];
}

function ClientRow({ client, colors, onPress }: { client: Client; colors: any; onPress: () => void }) {
  const initials = getInitials(client.name);
  const bgColor  = avatarColor(client.name);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: colors.surfaceElevated,
        borderRadius: 20, padding: 16, marginBottom: 8,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
      }}>
        {/* Avatar */}
        <View style={{
          width: 44, height: 44, borderRadius: 22,
          backgroundColor: bgColor + '30',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: bgColor }}>
            {initials}
          </Text>
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }} numberOfLines={1}>
            {client.name}
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
            {client.phone || 'Sin teléfono'}
          </Text>
        </View>

        {/* No-shows */}
        {client.no_show_count > 0 && (
          <View style={{
            backgroundColor: '#FF453A22', borderRadius: 8,
            paddingHorizontal: 8, paddingVertical: 4,
          }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#FF453A' }}>
              {client.no_show_count} falta{client.no_show_count !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      </View>
    </Pressable>
  );
}

export default function ClientsScreen() {
  const { colors, accent } = useTheme();
  const [search, setSearch] = useState('');

  const { data: clients = [], isLoading } = useClients(search);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>

      {/* ── Header ── */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 26, fontWeight: '700', color: colors.text }}>Clientas</Text>
            {clients.length > 0 && (
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                {clients.length} registrada{clients.length !== 1 ? 's' : ''}
              </Text>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {clients.length > 0 && (
              <View style={{
                backgroundColor: accent + '18', borderRadius: 10,
                paddingHorizontal: 10, paddingVertical: 5,
              }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: accent }}>
                  {clients.length}
                </Text>
              </View>
            )}
            <Pressable
              onPress={() => router.push('/client/new')}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <View style={{
                width: 36, height: 36, borderRadius: 12,
                backgroundColor: accent,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="add" size={22} color="#fff" />
              </View>
            </Pressable>
          </View>
        </View>

        {/* Buscador */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: 14, borderWidth: 1, borderColor: colors.border,
          paddingHorizontal: 14, paddingVertical: 10,
          marginTop: 14, gap: 10,
        }}>
          <Ionicons name="search" size={16} color={colors.textTertiary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por nombre..."
            placeholderTextColor={colors.placeholder}
            style={{ flex: 1, fontSize: 15, color: colors.text }}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* ── Lista / Estados ── */}
      {isLoading ? (
        <ActivityIndicator color={accent} style={{ marginTop: 40 }} />
      ) : clients.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 }}>
          <View style={{
            width: 72, height: 72, borderRadius: 22,
            backgroundColor: search ? colors.surface : accent + '18',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <Ionicons
              name={search ? 'search-outline' : 'people-outline'}
              size={32}
              color={search ? colors.textTertiary : accent}
            />
          </View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
            {search ? 'Sin resultados' : 'Sin clientas registradas'}
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 6, marginBottom: 20, textAlign: 'center' }}>
            {search ? `No encontramos "${search}"` : 'Agrega tu primera clienta'}
          </Text>
          {!search && (
            <Pressable
              onPress={() => router.push('/client/new')}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <View style={{
                backgroundColor: accent, borderRadius: 14,
                paddingHorizontal: 24, paddingVertical: 12,
              }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>
                  + Nueva clienta
                </Text>
              </View>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ClientRow
              client={item}
              colors={colors}
              onPress={() => router.push(`/client/${item.id}`)}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        />
      )}

    </SafeAreaView>
  );
}
