export const locationService = {
  async getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          })
        },
        (error) => {
          let message = 'Unable to retrieve location'
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location access denied by user'
              break
            case error.POSITION_UNAVAILABLE:
              message = 'Location information unavailable'
              break
            case error.TIMEOUT:
              message = 'Location request timed out'
              break
          }
          reject(new Error(message))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      )
    })
  },

  async watchPosition(callback, errorCallback) {
    if (!navigator.geolocation) {
      errorCallback(new Error('Geolocation is not supported'))
      return null
    }

    return navigator.geolocation.watchPosition(
      (position) => {
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        })
      },
      (error) => {
        errorCallback(error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // 1 minute
      }
    )
  },

  clearWatch(watchId) {
    if (watchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId)
    }
  },

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371 // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1)
    const dLon = this.deg2rad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c // Distance in kilometers
    return distance
  },

  deg2rad(deg) {
    return deg * (Math.PI / 180)
  },

  async geocodeAddress(address) {
    // TODO: Implement geocoding using Google Maps API or similar service
    // This is a placeholder implementation
    throw new Error('Geocoding service not implemented yet')
  },

  async reverseGeocode(latitude, longitude) {
    // TODO: Implement reverse geocoding using Google Maps API or similar service
    // This is a placeholder implementation
    throw new Error('Reverse geocoding service not implemented yet')
  }
}

export default locationService