import 'package:flutter/foundation.dart';

class PathHelper {
  //matches path.tsx IP
  static const String remoteAddress = '64.225.28.128';
  
  static String buildPath(String route) {
    if (kReleaseMode) {
      //For the final app
      return 'http://$remoteAddress:5000/$route';
    } else {
      //For Android Emulator to see local server
      return 'http://10.0.2.2:5000/$route';
    }
  }
}