class UserModel {
  final int userId;
  final String firstName;
  final String lastName;

  UserModel({required this.userId, required this.firstName, required this.lastName});

  // This maps the JSON from your Express API to the Dart object
  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      userId: json['userId'] ?? 0,
      firstName: json['firstName'] ?? '',
      lastName: json['lastName'] ?? '',
    );
  }
}