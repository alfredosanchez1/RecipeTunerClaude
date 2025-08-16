const SettingsScreen = () => {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState({
    mealReminders: true,
    healthAlerts: true,
    recipeUpdates: false
  });

  const settingSections = [
    {
      title: 'Cuenta',
      items: [
        { 
          label: 'Editar Perfil', 
          onPress: () => navigation.navigate('EditProfile'),
          icon: 'account-edit'
        },
        { 
          label: 'Cambiar Contraseña', 
          onPress: () => navigation.navigate('ChangePassword'),
          icon: 'lock'
        }
      ]
    },
    {
      title: 'Notificaciones',
      items: [
        { 
          label: 'Recordatorios de Comidas', 
          type: 'switch',
          value: notifications.mealReminders,
          onValueChange: (value) => setNotifications(prev => ({...prev, mealReminders: value})),
          icon: 'bell'
        },
        { 
          label: 'Alertas de Salud', 
          type: 'switch',
          value: notifications.healthAlerts,
          onValueChange: (value) => setNotifications(prev => ({...prev, healthAlerts: value})),
          icon: 'medical-bag'
        }
      ]
    },
    {
      title: 'Datos',
      items: [
        { 
          label: 'Exportar Mis Datos', 
          onPress: exportUserData,
          icon: 'download'
        },
        { 
          label: 'Eliminar Cuenta', 
          onPress: () => showDeleteAccountAlert(),
          icon: 'delete',
          danger: true
        }
      ]
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <UserProfileHeader user={user} />
      
      {settingSections.map((section, index) => (
        <SettingsSection key={index} title={section.title} items={section.items} />
      ))}
      
      <AppInfoSection />
    </ScrollView>
  );
};