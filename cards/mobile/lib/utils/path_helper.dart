import 'package:flutter/foundation.dart';

class PathHelper {
  // This matches your path.tsx IP
  static const String remoteAddress = '64.225.28.128';
  
  static String buildPath(String route) {
    if (kReleaseMode) {
      // For the final deployed app
      return 'http://$remoteAddress:5000/$route';
    } else {
      // For your Android Emulator to see your laptop's local server
      return 'http://10.0.2.2:5000/$route';
    }
  }
}