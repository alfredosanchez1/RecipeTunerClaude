import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { testDatabasePersistence, quickPersistenceTest } from '../utils/testPersistence';
import { debugRealmPersistence, testRealPersistence } from '../utils/debugRealmPersistence';
import { runPersistenceDiagnostic } from '../utils/persistenceDiagnostic';

const DatabaseTestComponent = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [quickTestResult, setQuickTestResult] = useState(null);
  const [debugResult, setDebugResult] = useState(null);
  const [realPersistenceResult, setRealPersistenceResult] = useState(null);
  const [diagnosticResult, setDiagnosticResult] = useState(null);

  const runFullTest = async () => {
    setIsRunning(true);
    setTestResults(null);
    
    try {
      const results = await testDatabasePersistence();
      setTestResults(results);
      
      if (results.success) {
        Alert.alert('✅ Éxito', 'Todos los tests de persistencia pasaron correctamente');
      } else {
        Alert.alert('❌ Error', `Tests fallaron: ${results.message}`);
      }
    } catch (error) {
      Alert.alert('❌ Error', `Error ejecutando tests: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const runQuickTest = async () => {
    setIsRunning(true);
    setQuickTestResult(null);
    
    try {
      const result = await quickPersistenceTest();
      setQuickTestResult(result);
      
      if (result) {
        Alert.alert('✅ Éxito', 'Test rápido de persistencia pasó correctamente');
      } else {
        Alert.alert('❌ Error', 'Test rápido de persistencia falló');
      }
    } catch (error) {
      Alert.alert('❌ Error', `Error en test rápido: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const runDebugRealm = async () => {
    setIsRunning(true);
    setDebugResult(null);

    try {
      const result = await debugRealmPersistence();
      setDebugResult(result);

      Alert.alert('🔍 Debug Realm',
        `Directorio: ${result.documentDirectory ? '✅' : '❌'}\n` +
        `Realm inicializado: ${result.realmInitialized ? '✅' : '❌'}\n` +
        `Path: ${result.realmPath || 'N/A'}`
      );
    } catch (error) {
      Alert.alert('❌ Error', `Error en debug: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const runRealPersistenceTest = async () => {
    setIsRunning(true);
    setRealPersistenceResult(null);

    try {
      const result = await testRealPersistence();
      setRealPersistenceResult(result);

      if (result.success) {
        Alert.alert('✅ Test Persistencia Real',
          `¡Test exitoso!\n` +
          `Receta persistió: ${result.recipePersisted ? '✅' : '❌'}\n` +
          `Preferencias persistieron: ${result.prefsPersisted ? '✅' : '❌'}\n` +
          `Path: ${result.realmPath || 'N/A'}`
        );
      } else {
        Alert.alert('❌ Test Persistencia Real',
          `Test falló: ${result.error || 'Error desconocido'}`
        );
      }
    } catch (error) {
      Alert.alert('❌ Error', `Error en test real: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const runPersistenceDiagnosticTest = async () => {
    setIsRunning(true);
    setDiagnosticResult(null);

    try {
      const result = await runPersistenceDiagnostic();
      setDiagnosticResult(result);

      const issueCount = result.issues.length;
      const recCount = result.recommendations.length;

      if (issueCount === 0) {
        Alert.alert('✅ Diagnóstico Completo',
          '¡La persistencia funciona correctamente!\n' +
          'No se encontraron problemas.'
        );
      } else {
        Alert.alert('🔍 Diagnóstico Completo',
          `Se encontraron ${issueCount} problema(s)\n` +
          `Se generaron ${recCount} recomendación(es)\n\n` +
          'Revisa los resultados detallados abajo.'
        );
      }
    } catch (error) {
      Alert.alert('❌ Error', `Error en diagnóstico: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setTestResults(null);
    setQuickTestResult(null);
    setDebugResult(null);
    setRealPersistenceResult(null);
    setDiagnosticResult(null);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🧪 Tests de Persistencia de Base de Datos</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={runFullTest}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            {isRunning ? '🔄 Ejecutando...' : '🧪 Ejecutar Test Completo'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={runQuickTest}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            {isRunning ? '🔄 Ejecutando...' : '⚡ Test Rápido'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.debugButton]}
          onPress={runDebugRealm}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            {isRunning ? '🔄 Ejecutando...' : '🔍 Debug Realm Files'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.advancedButton]}
          onPress={runRealPersistenceTest}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            {isRunning ? '🔄 Ejecutando...' : '🧪 Test Persistencia Real'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.diagnosticButton]}
          onPress={runPersistenceDiagnosticTest}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            {isRunning ? '🔄 Ejecutando...' : '🔍 Diagnóstico Completo'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearResults}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>🗑️ Limpiar Resultados</Text>
        </TouchableOpacity>
      </View>

      {/* Resultados del Test Rápido */}
      {quickTestResult !== null && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>⚡ Resultado Test Rápido:</Text>
          <Text style={[
            styles.resultText, 
            quickTestResult ? styles.successText : styles.errorText
          ]}>
            {quickTestResult ? '✅ ÉXITO - La persistencia funciona' : '❌ FALLA - Problema de persistencia'}
          </Text>
        </View>
      )}

      {/* Resultados del Test Completo */}
      {testResults && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>🧪 Resultados Test Completo:</Text>
          
          <View style={[
            styles.statusBadge, 
            testResults.success ? styles.successBadge : styles.errorBadge
          ]}>
            <Text style={styles.statusText}>
              {testResults.success ? '✅ ÉXITO' : '❌ FALLA'}
            </Text>
          </View>

          <Text style={styles.resultMessage}>{testResults.message}</Text>
          
          <Text style={styles.resultSubtitle}>📊 Base de Datos:</Text>
          <Text style={styles.resultText}>{testResults.database}</Text>
          
          <Text style={styles.resultSubtitle}>💾 Persistencia:</Text>
          <Text style={styles.resultText}>{testResults.persistence}</Text>
          
          <Text style={styles.resultSubtitle}>📋 Tests Ejecutados:</Text>
          {testResults.tests && testResults.tests.map((test, index) => (
            <Text key={index} style={styles.testItem}>• {test}</Text>
          ))}
          
          {testResults.stats && (
            <>
              <Text style={styles.resultSubtitle}>📈 Estadísticas:</Text>
              <Text style={styles.resultText}>
                • Recetas creadas: {testResults.stats.recipesCreated}
              </Text>
              <Text style={styles.resultText}>
                • Recetas recuperadas: {testResults.stats.recipesRetrieved}
              </Text>
              <Text style={styles.resultText}>
                • Preferencias guardadas: {testResults.stats.preferencesSaved}
              </Text>
              <Text style={styles.resultText}>
                • Datos persisten después de reinicio: {testResults.stats.dataPersistsAfterRestart ? 'Sí' : 'No'}
              </Text>
            </>
          )}
          
          <Text style={styles.resultSubtitle}>🕐 Timestamp:</Text>
          <Text style={styles.resultText}>{testResults.timestamp}</Text>
        </View>
      )}

      {/* Resultados del Debug Realm */}
      {debugResult && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>🔍 Debug Realm Files:</Text>

          <Text style={styles.resultSubtitle}>📁 Directorio:</Text>
          <Text style={styles.resultText}>{debugResult.documentDirectory || 'N/A'}</Text>

          <Text style={styles.resultSubtitle}>🗃️ Realm:</Text>
          <Text style={styles.resultText}>
            Inicializado: {debugResult.realmInitialized ? '✅' : '❌'}
          </Text>
          <Text style={styles.resultText}>
            Path: {debugResult.realmPath || 'N/A'}
          </Text>

          {debugResult.error && (
            <>
              <Text style={styles.resultSubtitle}>❌ Error:</Text>
              <Text style={[styles.resultText, styles.errorText]}>{debugResult.error}</Text>
            </>
          )}

          <Text style={styles.resultSubtitle}>🕐 Timestamp:</Text>
          <Text style={styles.resultText}>{debugResult.timestamp}</Text>
        </View>
      )}

      {/* Resultados del Test de Persistencia Real */}
      {realPersistenceResult && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>🧪 Test Persistencia Real:</Text>

          <View style={[
            styles.statusBadge,
            realPersistenceResult.success ? styles.successBadge : styles.errorBadge
          ]}>
            <Text style={styles.statusText}>
              {realPersistenceResult.success ? '✅ ÉXITO' : '❌ FALLA'}
            </Text>
          </View>

          <Text style={styles.resultSubtitle}>📊 Resultados:</Text>
          <Text style={styles.resultText}>
            • Receta persistió: {realPersistenceResult.recipePersisted ? '✅ Sí' : '❌ No'}
          </Text>
          <Text style={styles.resultText}>
            • Preferencias persistieron: {realPersistenceResult.prefsPersisted ? '✅ Sí' : '❌ No'}
          </Text>

          {realPersistenceResult.recipeCountBefore !== undefined && (
            <>
              <Text style={styles.resultSubtitle}>📈 Conteos:</Text>
              <Text style={styles.resultText}>
                • Recetas antes: {realPersistenceResult.recipeCountBefore}
              </Text>
              <Text style={styles.resultText}>
                • Recetas después: {realPersistenceResult.recipeCountAfter}
              </Text>
            </>
          )}

          <Text style={styles.resultSubtitle}>📁 Path:</Text>
          <Text style={styles.resultText}>{realPersistenceResult.realmPath || 'N/A'}</Text>

          {realPersistenceResult.error && (
            <>
              <Text style={styles.resultSubtitle}>❌ Error:</Text>
              <Text style={[styles.resultText, styles.errorText]}>{realPersistenceResult.error}</Text>
            </>
          )}

          <Text style={styles.resultSubtitle}>🕐 Timestamp:</Text>
          <Text style={styles.resultText}>{realPersistenceResult.timestamp}</Text>
        </View>
      )}

      {/* Resultados del Diagnóstico Completo */}
      {diagnosticResult && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>🔍 Diagnóstico de Persistencia:</Text>

          <View style={[
            styles.statusBadge,
            diagnosticResult.issues.length === 0 ? styles.successBadge : styles.errorBadge
          ]}>
            <Text style={styles.statusText}>
              {diagnosticResult.issues.length === 0 ? '✅ SIN PROBLEMAS' : `❌ ${diagnosticResult.issues.length} PROBLEMA(S)`}
            </Text>
          </View>

          <Text style={styles.resultSubtitle}>📊 Tests Ejecutados:</Text>
          {diagnosticResult.diagnostics.map((diag, index) => (
            <Text key={index} style={styles.testItem}>
              • {diag.test}: {diag.status === 'success' ? '✅' : '❌'}
            </Text>
          ))}

          {diagnosticResult.issues.length > 0 && (
            <>
              <Text style={styles.resultSubtitle}>❌ Problemas Encontrados:</Text>
              {diagnosticResult.issues.map((issue, index) => (
                <Text key={index} style={[styles.resultText, styles.errorText]}>
                  {index + 1}. {issue}
                </Text>
              ))}
            </>
          )}

          {diagnosticResult.recommendations.length > 0 && (
            <>
              <Text style={styles.resultSubtitle}>🔧 Recomendaciones:</Text>
              {diagnosticResult.recommendations.map((rec, index) => (
                <Text key={index} style={styles.resultText}>
                  {index + 1}. {rec}
                </Text>
              ))}
            </>
          )}

          <Text style={styles.resultSubtitle}>🕐 Timestamp:</Text>
          <Text style={styles.resultText}>{diagnosticResult.timestamp}</Text>
        </View>
      )}

      {/* Información adicional */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>ℹ️ Información:</Text>
        <Text style={styles.infoText}>
          • <Text style={styles.bold}>Test Rápido:</Text> Verifica creación y lectura básica
        </Text>
        <Text style={styles.infoText}>
          • <Text style={styles.bold}>Test Completo:</Text> Verifica todas las operaciones CRUD y persistencia
        </Text>
        <Text style={styles.infoText}>
          • <Text style={styles.bold}>Debug Realm:</Text> Inspecciona archivos y estado de la base de datos
        </Text>
        <Text style={styles.infoText}>
          • <Text style={styles.bold}>Test Persistencia Real:</Text> Crea datos, cierra Realm y verifica persistencia
        </Text>
        <Text style={styles.infoText}>
          • <Text style={styles.bold}>Diagnóstico Completo:</Text> Análisis exhaustivo de todos los aspectos de persistencia
        </Text>
        <Text style={styles.infoText}>
          • Los tests crean datos temporales que se limpian automáticamente
        </Text>
        <Text style={styles.infoText}>
          • Si algún test falla, revisa los logs de la consola para más detalles
        </Text>
        <Text style={styles.infoText}>
          • <Text style={styles.bold}>Recomendación:</Text> Ejecuta el Diagnóstico Completo si los datos no persisten
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  debugButton: {
    backgroundColor: '#9C27B0',
  },
  advancedButton: {
    backgroundColor: '#FF9800',
  },
  diagnosticButton: {
    backgroundColor: '#2196F3',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  resultMessage: {
    fontSize: 16,
    marginBottom: 15,
    color: '#666',
  },
  resultSubtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#333',
  },
  resultText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  testItem: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    marginBottom: 3,
  },
  statusBadge: {
    padding: 8,
    borderRadius: 5,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  successBadge: {
    backgroundColor: '#D4EDDA',
  },
  errorBadge: {
    backgroundColor: '#F8D7DA',
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  successText: {
    color: '#155724',
  },
  errorText: {
    color: '#721C24',
  },
  infoContainer: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1976D2',
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 5,
  },
  bold: {
    fontWeight: 'bold',
  },
});

export default DatabaseTestComponent;
