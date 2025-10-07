import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Share, Alert } from 'react-native';
import { Text, Title, Card, Button, ActivityIndicator, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { getLogs, clearLogs, exportLogsAsText, LOG_LEVELS } from '../../services/logger';

const DebugLogsScreen = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL'); // ALL, ERROR, WARNING, INFO

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const allLogs = await getLogs();
      setLogs(allLogs);
    } catch (error) {
      console.error('Error cargando logs:', error);
      Alert.alert('Error', 'No se pudieron cargar los logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadLogs();
  };

  const handleClearLogs = () => {
    Alert.alert(
      'Limpiar Logs',
      '¿Estás seguro de que deseas eliminar todos los logs?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearLogs();
              setLogs([]);
              Alert.alert('Éxito', 'Logs eliminados correctamente');
            } catch (error) {
              console.error('Error limpiando logs:', error);
              Alert.alert('Error', 'No se pudieron eliminar los logs');
            }
          }
        }
      ]
    );
  };

  const handleExportLogs = async () => {
    try {
      const logsText = await exportLogsAsText();

      await Share.share({
        message: logsText,
        title: `RecipeTuner Debug Logs - ${new Date().toLocaleDateString()}`
      });
    } catch (error) {
      console.error('Error exportando logs:', error);
      Alert.alert('Error', 'No se pudieron exportar los logs');
    }
  };

  const getFilteredLogs = () => {
    if (filter === 'ALL') return logs;
    return logs.filter(log => log.level === filter);
  };

  const getLevelColor = (level) => {
    switch (level) {
      case LOG_LEVELS.ERROR:
        return '#F44336';
      case LOG_LEVELS.WARNING:
        return '#FF9800';
      case LOG_LEVELS.INFO:
        return '#2196F3';
      default:
        return '#9E9E9E';
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case LOG_LEVELS.ERROR:
        return 'alert-circle';
      case LOG_LEVELS.WARNING:
        return 'alert';
      case LOG_LEVELS.INFO:
        return 'information';
      default:
        return 'message';
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Cargando logs...</Text>
      </SafeAreaView>
    );
  }

  const filteredLogs = getFilteredLogs();

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Header con estadísticas */}
      <View style={styles.header}>
        <Title style={styles.headerTitle}>🔍 Debug Logs</Title>
        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            Total: {logs.length} logs
          </Text>
          <Text style={styles.statsText}>
            Errores: {logs.filter(l => l.level === LOG_LEVELS.ERROR).length}
          </Text>
        </View>
      </View>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Chip
            selected={filter === 'ALL'}
            onPress={() => setFilter('ALL')}
            style={styles.filterChip}
            textStyle={filter === 'ALL' ? styles.selectedChipText : null}
          >
            Todos ({logs.length})
          </Chip>
          <Chip
            selected={filter === LOG_LEVELS.ERROR}
            onPress={() => setFilter(LOG_LEVELS.ERROR)}
            style={styles.filterChip}
            textStyle={filter === LOG_LEVELS.ERROR ? styles.selectedChipText : null}
          >
            Errores ({logs.filter(l => l.level === LOG_LEVELS.ERROR).length})
          </Chip>
          <Chip
            selected={filter === LOG_LEVELS.WARNING}
            onPress={() => setFilter(LOG_LEVELS.WARNING)}
            style={styles.filterChip}
            textStyle={filter === LOG_LEVELS.WARNING ? styles.selectedChipText : null}
          >
            Advertencias ({logs.filter(l => l.level === LOG_LEVELS.WARNING).length})
          </Chip>
          <Chip
            selected={filter === LOG_LEVELS.INFO}
            onPress={() => setFilter(LOG_LEVELS.INFO)}
            style={styles.filterChip}
            textStyle={filter === LOG_LEVELS.INFO ? styles.selectedChipText : null}
          >
            Info ({logs.filter(l => l.level === LOG_LEVELS.INFO).length})
          </Chip>
        </ScrollView>
      </View>

      {/* Botones de acción */}
      <View style={styles.actionsContainer}>
        <Button
          mode="outlined"
          onPress={handleExportLogs}
          icon="share-variant"
          style={styles.actionButton}
          disabled={logs.length === 0}
        >
          Exportar
        </Button>
        <Button
          mode="outlined"
          onPress={handleClearLogs}
          icon="delete"
          style={styles.actionButton}
          textColor="#F44336"
          disabled={logs.length === 0}
        >
          Limpiar
        </Button>
      </View>

      {/* Lista de logs */}
      <ScrollView
        style={styles.logsContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredLogs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="check-circle" size={80} color="#4CAF50" />
            <Text style={styles.emptyText}>
              {filter === 'ALL'
                ? 'No hay logs registrados'
                : `No hay logs de tipo ${filter}`}
            </Text>
            <Text style={styles.emptySubtext}>
              Los errores y eventos se registrarán automáticamente
            </Text>
          </View>
        ) : (
          filteredLogs.map((log) => (
            <Card key={log.id} style={styles.logCard}>
              <Card.Content>
                {/* Header del log */}
                <View style={styles.logHeader}>
                  <View style={styles.logHeaderLeft}>
                    <Icon
                      name={getLevelIcon(log.level)}
                      size={20}
                      color={getLevelColor(log.level)}
                    />
                    <Text
                      style={[
                        styles.logLevel,
                        { color: getLevelColor(log.level) }
                      ]}
                    >
                      {log.level}
                    </Text>
                    <Chip
                      mode="outlined"
                      style={styles.categoryChip}
                      textStyle={styles.categoryText}
                    >
                      {log.category}
                    </Chip>
                  </View>
                </View>

                {/* Timestamp */}
                <Text style={styles.logTimestamp}>
                  {formatDate(log.timestamp)}
                </Text>

                {/* Mensaje principal */}
                <Text style={styles.logMessage}>{log.message}</Text>

                {/* Detalles del error */}
                {log.details.errorMessage && (
                  <View style={styles.errorDetails}>
                    <Text style={styles.errorLabel}>Error:</Text>
                    <Text style={styles.errorMessage}>
                      {log.details.errorMessage}
                    </Text>
                  </View>
                )}

                {/* Stack trace (colapsado por defecto) */}
                {log.details.stack && (
                  <View style={styles.stackContainer}>
                    <Text style={styles.stackLabel}>Stack Trace:</Text>
                    <ScrollView
                      horizontal
                      style={styles.stackScroll}
                      showsHorizontalScrollIndicator={false}
                    >
                      <Text style={styles.stackTrace}>
                        {log.details.stack}
                      </Text>
                    </ScrollView>
                  </View>
                )}
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsText: {
    fontSize: 14,
    color: '#666',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterChip: {
    marginRight: 10,
  },
  selectedChipText: {
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  actionButton: {
    flex: 1,
  },
  logsContainer: {
    flex: 1,
    padding: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  logCard: {
    marginBottom: 15,
    elevation: 2,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logLevel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  categoryChip: {
    height: 24,
  },
  categoryText: {
    fontSize: 11,
  },
  logTimestamp: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  logMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
    lineHeight: 20,
  },
  errorDetails: {
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 4,
    marginBottom: 10,
  },
  errorLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#C62828',
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 13,
    color: '#D32F2F',
  },
  stackContainer: {
    backgroundColor: '#F5F5F5',
    padding: 10,
    borderRadius: 4,
    marginTop: 5,
  },
  stackLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  stackScroll: {
    maxHeight: 100,
  },
  stackTrace: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#333',
  },
});

export default DebugLogsScreen;
