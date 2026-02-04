#!/bin/bash
# Script de ayuda para desplegar PulseGuard en Fly.io

set -e

echo "🚀 PulseGuard - Configuración para Fly.io"
echo "=========================================="

# Verificar que fly CLI está instalado
if ! command -v fly &> /dev/null; then
    echo "❌ Error: fly CLI no está instalado"
    echo "   Instala con: curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Verificar autenticación
if ! fly auth whoami &> /dev/null; then
    echo "❌ Error: No estás autenticado en Fly.io"
    echo "   Ejecuta: fly auth login"
    exit 1
fi

echo "✅ fly CLI configurado correctamente"
echo ""

# Mostrar secretos actuales
echo "📋 Secretos actuales configurados:"
fly secrets list || echo "   (ninguno)"
echo ""

# Verificar secretos necesarios
echo "🔐 Verificando secretos necesarios..."

check_secret() {
    local secret_name=$1
    local secret_example=$2
    if fly secrets list 2>/dev/null | grep -q "^$secret_name"; then
        echo "   ✅ $secret_name está configurado"
        return 0
    else
        echo "   ❌ $secret_name NO está configurado"
        echo "      Ejecuta: fly secrets set $secret_name=\"$secret_example\""
        return 1
    fi
}

MISSING_SECRETS=0

check_secret "DATABASE_URL" "libsql://tu-db.turso.io" || MISSING_SECRETS=1
check_secret "TURSO_AUTH_TOKEN" "tu-auth-token-de-turso" || MISSING_SECRETS=1
check_secret "SESSION_SECRET" "\$(openssl rand -base64 32)" || MISSING_SECRETS=1

echo ""

if [ $MISSING_SECRETS -eq 1 ]; then
    echo "⚠️  Hay secretos sin configurar. Configúralos antes de desplegar."
    echo ""
    echo "📝 Comandos para configurar todos los secretos:"
    echo ""
    echo "   # Base de datos Turso"
    echo "   fly secrets set DATABASE_URL=\"libsql://tu-db.turso.io\""
    echo "   fly secrets set TURSO_AUTH_TOKEN=\"tu-auth-token\""
    echo ""
    echo "   # Sesión (genera uno seguro)"
    echo "   fly secrets set SESSION_SECRET=\"\$(openssl rand -base64 32)\""
    echo ""
    echo "   # O configura todos de una vez:"
    echo "   fly secrets set \\"
    echo "     DATABASE_URL=\"tu-url\" \\"
    echo "     TURSO_AUTH_TOKEN=\"tu-token\" \\"
    echo "     SESSION_SECRET=\"\$(openssl rand -base64 32)\""
    echo ""
    exit 1
fi

echo "✅ Todos los secretos están configurados"
echo ""

# Preguntar si desea desplegar
read -p "¿Deseas desplegar ahora? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Iniciando despliegue..."
    fly deploy
else
    echo ""
    echo "Para desplegar manualmente ejecuta: fly deploy"
fi
