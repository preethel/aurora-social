#!/bin/bash
# Quick commands for common database issues

echo "Aurora Social - Quick Database Commands"
echo "========================================"
echo ""

# Find postgres network
POSTGRES_NETWORK=$(docker inspect wealthgrow-postgres --format='{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}' 2>/dev/null)

if [ -z "$POSTGRES_NETWORK" ]; then
  echo "❌ wealthgrow-postgres not found"
  exit 1
fi

echo "PostgreSQL Network: $POSTGRES_NETWORK"
echo ""
echo "Quick Fix Commands:"
echo ""
echo "1. Connect aurora-social to postgres network:"
echo "   docker network connect $POSTGRES_NETWORK aurora-social-app"
echo ""
echo "2. Test connection:"
echo "   docker exec aurora-social-app ping -c 2 wealthgrow-postgres"
echo ""
echo "3. Create database if needed:"
echo "   docker exec -it wealthgrow-postgres psql -U postgres -c 'CREATE DATABASE \"auroraDb\";'"
echo ""
echo "4. Run migrations:"
echo "   docker exec aurora-social-app npx prisma migrate deploy"
echo ""
echo "5. Check migration status:"
echo "   docker exec aurora-social-app npx prisma migrate status"
echo ""
echo "6. View logs:"
echo "   docker logs -f aurora-social-app"
echo ""
echo "7. Restart container:"
echo "   docker restart aurora-social-app"
echo ""
echo "Full network info:"
docker network inspect $POSTGRES_NETWORK | grep -A 5 -E 'aurora-social-app|wealthgrow-postgres'
